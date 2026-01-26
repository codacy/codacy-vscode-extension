import * as vscode from 'vscode'
export const CODACY_FOLDER_NAME = '.codacy'
import { exec } from 'child_process'
import { Config } from '../common'
import Logger from '../common/logger'
import { ProcessedSarifResult } from '.'

// Set a larger buffer size (10MB)
const MAX_BUFFER_SIZE = 1024 * 1024 * 10

export abstract class CodacyCli {
  public _cliCommand: string = ''

  public readonly _accountToken = Config.apiToken
  public readonly _cliVersion = vscode.workspace.getConfiguration().get('codacy.cli.cliVersion')

  public readonly rootPath: string
  public readonly provider?: string
  public readonly organization?: string
  public readonly repository?: string

  constructor(rootPath: string, provider?: string, organization?: string, repository?: string) {
    this.rootPath = rootPath
    this.provider = provider
    this.organization = organization
    this.repository = repository
  }

  public abstract preflightCodacyCli(autoInstall: boolean): Promise<void>

  public abstract install(): Promise<void>
  public abstract installDependencies(): Promise<void>

  public abstract update(): Promise<void>
  public abstract initialize(): Promise<void>

  public abstract analyze(options: { file?: string; tool?: string }): Promise<ProcessedSarifResult[] | null>

  public abstract configDiscover(filePath: string): Promise<void>

  public getCliCommand(): string {
    return this._cliCommand
  }

  protected setCliCommand(command: string): void {
    this._cliCommand = command
    vscode.commands.executeCommand('setContext', 'codacy:cliInstalled', !!command)
  }

  protected preparePathForExec(path: string): string {
    // Wrap path in double quotes and escape characters that are special inside double quotes
    // Special characters inside double quotes that we escape: $, `, \, "
    // This approach works both when the path is used directly and when wrapped in additional quotes
    const escaped = path.replace(/([\\$"`])/g, '\\$1')
    return `"${escaped}"`
  }

  protected getIdentificationParameters(): Record<string, string> {
    return (
      this._accountToken && this.repository && this.provider && this.organization
        ? {
            provider: this.provider,
            organization: this.organization,
            repository: this.repository,
            'api-token': this._accountToken,
          }
        : {}
    ) as Record<string, string>
  }

  protected execAsync(command: string, args?: Record<string, string>): Promise<{ stdout: string; stderr: string }> {
    // stringyfy the args
    const argsString = Object.entries(args || {})
      .map(([key, value]) => `--${key} ${value}`)
      .join(' ')

    // Add the args to the command and remove any shell metacharacters
    const cmd = `${command} ${argsString}`.trim().replace(/[;&|`$]/g, '')

    // Add the CODACY_CLI_VERSION to the command
    return new Promise((resolve, reject) => {
      exec(
        cmd,
        {
          cwd: this.rootPath,
          maxBuffer: MAX_BUFFER_SIZE, // To solve: stdout maxBuffer exceeded
          encoding: 'utf-8',
        },
        (error, stdout, stderr) => {
          if (error) {
            reject(error)
            return
          }

          if (stderr && !stdout) {
            Logger.warn(`Codacy CLI V2 warnings: ${stderr}`)
            reject(new Error(stderr))
            return
          }

          resolve({ stdout, stderr })
        }
      )
    })
  }
}
