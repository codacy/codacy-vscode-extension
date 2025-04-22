import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { Config } from '../common/config'
import { Repository } from '../api/client'

const execAsync = promisify(exec)

const codacyCli = 'cli.sh'

const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ''
const codacyFolder = path.join(workspacePath, '.codacy2')
const codacyCliPath = path.join(codacyFolder, codacyCli)
const codacyCliRelativePath = path.join('.codacy', codacyCli)

export async function isCLIInstalled(): Promise<boolean> {
  try {
    await execAsync(`${codacyCliPath} --help`)
    return true
  } catch {
    return false
  }
}

async function downloadCodacyCLI(): Promise<void> {
  try {
    if (!fs.existsSync(codacyFolder)) {
      fs.mkdirSync(codacyFolder, { recursive: true })
    }

    if (!fs.existsSync(codacyCliPath)) {
      await execAsync(
        `curl -Ls -o "${codacyCliPath}" https://raw.githubusercontent.com/codacy/codacy-cli-v2/main/codacy-cli.sh`
      )
      await execAsync(`chmod +x "${codacyCliPath}"`)
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to download Codacy CLI: ${error.message}`)
    }
    throw error
  }
}

async function initializeCLI(repository: Repository): Promise<void> {
  const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ''
  const codacyYamlPath = path.join(workspacePath, '.codacy', 'codacy.yaml')
  const apiToken = Config.apiToken

  const { provider, owner: organization, name: repositoryName } = repository

  try {
    if (!fs.existsSync(codacyYamlPath)) {
      await execAsync(
        `${codacyCliRelativePath} init --api-token ${apiToken} --provider ${provider} --organization ${organization} --repository ${repositoryName}`
      )
    }
    await execAsync(`${codacyCliRelativePath} install`)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to initialize Codacy CLI: ${error.message}`)
    }
    throw error
  }
}

export async function installCodacyCLI(repository: Repository): Promise<void> {
  if (await isCLIInstalled()) {
    await initializeCLI(repository)
    return
  }

  try {
    await downloadCodacyCLI()

    await initializeCLI(repository)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to install Codacy CLI: ${error.message}`)
    }
    throw error
  }
}
