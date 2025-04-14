import * as os from 'os'
import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { parseGitRemote } from '../common/parseGitRemote'
import { Config } from '../common/config'

const execAsync = promisify(exec)

export async function isCLIInstalled(): Promise<boolean> {
  try {
    await execAsync('codacy-cli --help')
    return true
  } catch {
    return false
  }
}

async function isBrewInstalled(): Promise<boolean> {
  try {
    await execAsync('brew --version')
    return true
  } catch {
    return false
  }
}

async function initializeCLI(): Promise<void> {
  const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ''
  const codacyYamlPath = path.join(workspacePath, '.codacy', 'codacy.yaml')
  const apiToken = Config.apiToken

  const git = vscode.extensions.getExtension('vscode.git')?.exports.getAPI(1)
  const repo = git?.repositories[0]
  let provider, organization, repository

  if (repo?.state.remotes[0]?.pushUrl) {
    const gitInfo = parseGitRemote(repo.state.remotes[0].pushUrl)
    provider = gitInfo.provider
    organization = gitInfo.organization
    repository = gitInfo.repository
  }
  try {
    if (!fs.existsSync(codacyYamlPath)) {
      await execAsync(
        `codacy-cli init --api-token ${apiToken} --provider ${provider} --organization ${organization} --repository ${repository}`
      )
    }
    await execAsync('codacy-cli install')
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to initialize Codacy CLI: ${error.message}`)
    }
    throw error
  }
}

export async function installCodacyCLI(): Promise<void> {
  const platform = os.platform()

  if (await isCLIInstalled()) {
    await initializeCLI()
    return
  }

  try {
    switch (platform) {
      case 'darwin':
        if (!(await isBrewInstalled())) {
          throw new Error('Please install Homebrew first and then try installing the Codacy CLI again.')
        }
        await execAsync('brew install codacy/codacy-cli-v2/codacy-cli-v2')
        break

      case 'linux':
        await execAsync('bash <(curl -Ls https://raw.githubusercontent.com/codacy/codacy-cli-v2/main/codacy-cli.sh)')
        break

      case 'win32':
        throw new Error('Codacy CLI is not supported on Windows yet.')

      default:
        throw new Error(`Unsupported operating system: ${platform}`)
    }

    await initializeCLI()
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to install Codacy CLI: ${error.message}`)
    }
    throw error
  }
}
