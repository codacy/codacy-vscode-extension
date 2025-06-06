import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import { Config, CodacyError } from '../common'
import Logger from '../common/logger'
import { RepositoryParams } from '../git/CodacyCloud'

const CLI_FILE_NAME = 'cli.sh'
const CLI_FOLDER_NAME = '.codacy'
const CLI_COMMAND = `${CLI_FOLDER_NAME}/${CLI_FILE_NAME}`

// Set a larger buffer size (10MB)
const MAX_BUFFER_SIZE = 1024 * 1024 * 10

const execAsync = (command: string) => {
  const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ''
  const cliVersion = vscode.workspace.getConfiguration().get('codacy.cli.cliVersion')

  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    exec(
      `${cliVersion ? `CODACY_CLI_V2_VERSION=${cliVersion}` : ''} ${command}`,
      {
        cwd: workspacePath,
        maxBuffer: MAX_BUFFER_SIZE, // To solve: stdout maxBuffer exceeded
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(error)
          return
        }

        if (stderr && !stdout) {
          reject(new Error(stderr))
          return
        }

        resolve({ stdout, stderr })
      }
    )
  })
}

export async function isCLIInstalled(): Promise<boolean> {
  try {
    await execAsync(`${CLI_COMMAND} --help`)
    return true
  } catch {
    return false
  }
}

async function downloadCodacyCLI(): Promise<void> {
  const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ''
  const codacyFolder = path.join(workspacePath, CLI_FOLDER_NAME)
  const codacyCliPath = path.join(codacyFolder, CLI_FILE_NAME)

  // Create .codacy folder if it doesn't exist
  if (!fs.existsSync(codacyFolder)) {
    fs.mkdirSync(codacyFolder, { recursive: true })
  }

  // Download cli.sh if it doesn't exist
  if (!fs.existsSync(codacyCliPath)) {
    await execAsync(
      `curl -Ls -o "${CLI_COMMAND}" https://raw.githubusercontent.com/codacy/codacy-cli-v2/main/codacy-cli.sh`
    )

    await execAsync(`chmod +x "${CLI_COMMAND}"`)
  }
}

async function initializeCLI(params?: RepositoryParams): Promise<void> {
  const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ''
  const codacyYamlPath = path.join(workspacePath, '.codacy', 'codacy.yaml')

  const tokenAndRepository =
    Config.apiToken && params
      ? `--api-token ${Config.apiToken} --provider ${params.provider} --organization ${params.organization} --repository ${params.repository}`
      : ''

  if (!fs.existsSync(codacyYamlPath)) {
    await execAsync(`${CLI_COMMAND} init ${tokenAndRepository}`)
  }

  await execAsync(`${CLI_COMMAND} install`)

  // add cli.sh to .gitignore
  const gitignorePath = path.join(workspacePath, '.codacy', '.gitignore')
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, '*.sh\n')
  } else {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8')
    if (!gitignoreContent.includes('*.sh')) {
      fs.appendFileSync(gitignorePath, '*.sh\n')
    }
  }
}

export async function updateCLIState(): Promise<boolean> {
  const cliInstalled = await isCLIInstalled()
  vscode.commands.executeCommand('setContext', 'codacy:cliInstalled', cliInstalled)

  return cliInstalled
}

export async function installCLICommand(params?: RepositoryParams): Promise<void> {
  await vscode.commands.executeCommand('setContext', 'codacy:cliInstalling', true)

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Window,
      title: 'Installing Codacy CLI',
      cancellable: false,
    },
    async () => {
      try {
        await installCodacyCLI(params)
        await updateCLIState()
        vscode.window.showInformationMessage('Codacy CLI installed successfully!')
      } catch (error) {
        throw new CodacyError('Failed to install Codacy CLI', error as Error, 'CLI')
      } finally {
        await vscode.commands.executeCommand('setContext', 'codacy:cliInstalling', false)
      }
    }
  )
}

export async function installCodacyCLI(params?: RepositoryParams): Promise<void> {
  try {
    const isInstalled = await isCLIInstalled()

    if (!isInstalled) {
      await downloadCodacyCLI()
    }

    await initializeCLI(params)
  } catch (error) {
    if (error instanceof Error) {
      Logger.error(`Failed to install Codacy CLI: ${error.message}`)
    }
    throw error
  }
}

export async function updateCodacyCLI(params?: RepositoryParams): Promise<void> {
  try {
    await execAsync(`${CLI_COMMAND} update`)

    await initializeCLI(params)
  } catch (error) {
    if (error instanceof Error) {
      Logger.error(`Failed to update Codacy CLI: ${error.message}`)
    }
  }
}
