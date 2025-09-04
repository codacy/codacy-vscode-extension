import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { CodacyError } from '../common/utils'

import { CODACY_FOLDER_NAME, CodacyCli } from './CodacyCli'
import Logger from '../common/logger'
import { ProcessedSarifResult, processSarifResults } from '.'
import { Config } from '../common/config'

export class MacCodacyCli extends CodacyCli {
  constructor(rootPath: string, provider?: string, organization?: string, repository?: string) {
    vscode.commands.executeCommand('setContext', 'codacy:canInstallCLI', true)
    super(rootPath, provider, organization, repository)
  }

  protected async findCliCommand(autoInstall: boolean = false): Promise<void> {
    this.setCliCommand('')

    // check if .codacy/cli.sh exists
    const localPath = path.join(CODACY_FOLDER_NAME, 'cli.sh')
    const fullPath = path.join(this.rootPath, localPath)

    if (fs.existsSync(fullPath)) {
      this.setCliCommand(this._cliVersion ? `CODACY_CLI_V2_VERSION=${this._cliVersion} ${localPath}` : localPath)
      return
    }

    // CLI not found, attempt to install it
    if (autoInstall) await this.install()
    return
  }

  public async preflightCodacyCli(autoInstall: boolean): Promise<void> {
    // is there a command?
    if (!this.getCliCommand()) {
      await this.findCliCommand(autoInstall)
    } else {
      await this.initialize()
    }
  }

  public async install(): Promise<void> {
    await vscode.commands.executeCommand('setContext', 'codacy:cliInstalling', true)

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Window,
        title: 'Installing Codacy CLI',
        cancellable: false,
      },
      async () => {
        try {
          const codacyFolder = path.join(this.rootPath, CODACY_FOLDER_NAME)
          if (!fs.existsSync(codacyFolder)) {
            fs.mkdirSync(codacyFolder, { recursive: true })
          }

          // Download cli.sh if it doesn't exist
          const codacyCliPath = path.join(CODACY_FOLDER_NAME, 'cli.sh')

          if (!fs.existsSync(codacyCliPath)) {
            const execPath = this.preparePathForExec(codacyCliPath)

            await this.execAsync(
              `curl -Ls -o "${execPath}" https://raw.githubusercontent.com/codacy/codacy-cli-v2/main/codacy-cli.sh`
            )

            await this.execAsync(`chmod +x "${execPath}"`)

            this.setCliCommand(
              this._cliVersion ? `CODACY_CLI_V2_VERSION=${this._cliVersion} ${codacyCliPath}` : codacyCliPath
            )
          }
          vscode.window.showInformationMessage('Codacy CLI installed successfully!')
        } catch (error) {
          Logger.error(`Failed to install Codacy CLI: ${error}`)
          throw new Error(`Failed to install Codacy CLI: ${error}`)
        } finally {
          await vscode.commands.executeCommand('setContext', 'codacy:cliInstalling', false)
        }

        // Initialize codacy-cli after installation
        await this.initialize()
      }
    )
  }

  public async installDependencies(): Promise<void> {
    const command = `${this.getCliCommand()} install`
    try {
      await this.execAsync(command)
    } catch (error) {
      throw new Error(`Failed to install dependencies: ${error}`)
    }
  }

  public async update(): Promise<void> {
    const resetParams = (
      this._accountToken && this.repository && this.provider && this.organization
        ? {
            provider: this.provider,
            organization: this.organization,
            repository: this.repository,
            'api-token': this._accountToken,
          }
        : {}
    ) as Record<string, string>
    const updateCommand = `${this.getCliCommand()} update`
    const resetCommand = `${this.getCliCommand()} config reset`
    try {
      await this.execAsync(updateCommand)
      await this.execAsync(resetCommand, resetParams)

      // Initialize codacy-cli after update
      await this.initialize()
    } catch (error) {
      Logger.error(`Failed to update Codacy CLI: ${error}`)
      throw new Error(`Failed to update CLI: ${error}`)
    }
  }

  public async initialize(): Promise<void> {
    // Check if the configuration files exist
    const configFilePath = path.join(this.rootPath, CODACY_FOLDER_NAME, 'codacy.yaml')
    const cliConfigFilePath = path.join(this.rootPath, CODACY_FOLDER_NAME, 'cli-config.yaml')
    const toolsFolderPath = path.join(this.rootPath, CODACY_FOLDER_NAME, 'tools-configs')

    const devMode = Config.devMode

    const initFilesOk =
      fs.existsSync(configFilePath) && fs.existsSync(cliConfigFilePath) && fs.existsSync(toolsFolderPath)
    let needsInitialization = !initFilesOk

    if (initFilesOk) {
      // Check if the mode matches the current properties
      const cliConfig = fs.readFileSync(path.join(this.rootPath, CODACY_FOLDER_NAME, 'cli-config.yaml'), 'utf-8')

      if (
        ((cliConfig === 'mode: local' && this.repository) || (cliConfig === 'mode: remote' && !this.repository)) &&
        !devMode
      ) {
        needsInitialization = true
      }
    }

    if (!needsInitialization && devMode) {
      // install dependencies
      await this.installDependencies()
      Logger.debug('Dev mode enabled. Skipping initialization.')
    }

    if (needsInitialization) {
      const initParams = (
        this._accountToken && this.repository && this.provider && this.organization
          ? {
              provider: this.provider,
              organization: this.organization,
              repository: this.repository,
              'api-token': this._accountToken,
            }
          : {}
      ) as Record<string, string>

      try {
        // initialize codacy-cli
        await this.execAsync(`${this.getCliCommand()} init`, initParams)
      } catch (error) {
        throw new Error(`Failed to initialize CLI: ${error}`)
      }

      // install dependencies
      await this.installDependencies()

      // add cli.sh to .gitignore
      const gitignorePath = path.join(this.rootPath, '.codacy', '.gitignore')
      if (!fs.existsSync(gitignorePath)) {
        fs.writeFileSync(gitignorePath, '*.sh\n')
      } else {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8')
        if (!gitignoreContent.includes('*.sh')) {
          fs.appendFileSync(gitignorePath, '*.sh\n')
        }
      }
    }
  }

  public async analyze(options: { file?: string; tool?: string }): Promise<ProcessedSarifResult[] | null> {
    await this.preflightCodacyCli(true)

    if (!this.getCliCommand()) {
      throw new Error('CLI command not found. Please install the CLI first.')
    }

    const { file, tool } = options

    Logger.debug(`Running Codacy CLI V2 analyze command for ${file || 'entire workspace'}...`)

    try {
      const { stdout } = await this.execAsync(
        `${this.getCliCommand()} analyze ${file ? this.preparePathForExec(file) : ''} --format sarif`,
        tool ? { tool: tool } : {}
      )

      const jsonMatch = /(\{[\s\S]*\}|\[[\s\S]*\])/.exec(stdout)

      const sarifResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null

      const results: ProcessedSarifResult[] =
        sarifResult && 'runs' in sarifResult ? processSarifResults(sarifResult.runs) : []

      Logger.debug(`Codacy CLI V2 analysis completed for ${file || 'entire workspace'} with ${results.length} results.`)

      return results
    } catch (error: unknown) {
      if (error instanceof CodacyError) {
        throw error
      } else {
        throw new CodacyError('Failed to run Codacy analysis', error as Error, 'CLI')
      }
    }
  }
}
