import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'
import { get, set } from 'lodash'
import { CodacyCli } from '../cli/CodacyCli'
import Logger from '../common/logger'
import { CodacyError, Config } from '../common'
import { RepositoryParams } from '../git/CodacyCloud'
import { createWindsurfWorkflows } from './createWorkflows'
import { createOrUpdateRules } from './createRules'

// Function to sanitize the JSON content to avoid trailing commas
const sanitizeJSON = (json: string): string => {
  return json.replace(/,([\s\r\n]*[}\]])/g, '$1')
}

export function updateMCPState() {
  const isConfigured = isMCPConfigured()
  vscode.commands.executeCommand('setContext', 'codacy:mcpConfigured', isConfigured)
}

/**
 * Detects if the current environment is running in Windows Subsystem for Linux (WSL)
 * @returns boolean indicating if the current environment is WSL
 */
export function isRunningInWsl(): boolean {
  if (os.platform() !== 'linux') {
    return false
  }

  try {
    const osReleaseContent = fs.readFileSync('/proc/version', 'utf8')
    return osReleaseContent.toLowerCase().includes('microsoft') || osReleaseContent.toLowerCase().includes('wsl')
  } catch {
    // If we can't read the file, assume it's not WSL
    return false
  }
}

export function getCurrentIDE(): string {
  const isCursor = vscode.env.appName.toLowerCase().includes('cursor')
  const isWindsurf = vscode.env.appName.toLowerCase().includes('windsurf')
  const isVSCodeInsiders = vscode.env.appName.toLowerCase().includes('insiders')
  if (isCursor) return 'cursor'
  if (isWindsurf) return 'windsurf'
  if (isVSCodeInsiders) return 'insiders'
  return 'vscode'
}

function getCorrectMcpConfig(): {
  fileDir: string
  fileName: string
  configAccessor: string
} {
  const currentIde = getCurrentIDE()

  if (currentIde === 'cursor')
    return {
      fileDir: path.join(os.homedir(), '.cursor'),
      fileName: 'mcp.json',
      configAccessor: 'mcpServers',
    }
  if (currentIde === 'windsurf')
    return {
      fileDir: path.join(os.homedir(), '.codeium', 'windsurf'),
      fileName: 'mcp_config.json',
      configAccessor: 'mcpServers',
    }

  // Get platform-specific VS Code settings directory
  let vsCodeSettingsPath: string

  const correctVSCodeIde = currentIde === 'insiders' ? 'Code - Insiders' : 'Code'

  if (process.platform === 'win32') {
    vsCodeSettingsPath = path.join(os.homedir(), 'AppData', 'Roaming', correctVSCodeIde, 'User')
  } else if (process.platform === 'darwin') {
    vsCodeSettingsPath = path.join(os.homedir(), 'Library', 'Application Support', correctVSCodeIde, 'User')
  } /* Linux */ else {
    // Could be WSL, but no way of getting the exact path on Windows from WSL
    if (isRunningInWsl()) {
      throw new Error('Running in WSL is not supported for MCP configuration via file')
    }
    vsCodeSettingsPath = path.join(os.homedir(), '.config', correctVSCodeIde, 'User')
  }

  return {
    fileDir: vsCodeSettingsPath,
    fileName: 'settings.json',
    configAccessor: 'mcp.servers',
  }
}

export function isMCPConfigured(): boolean {
  try {
    const currentIde = getCurrentIDE()
    Logger.debug(`Checking if MCP is configured for ${currentIde}`, 'MCP')

    // Use VS Code API if available
    try {
      if (currentIde === 'vscode' || currentIde === 'insiders') {
        const mcpServers = vscode.workspace.getConfiguration('mcp').get('servers')

        if (
          mcpServers !== undefined &&
          typeof mcpServers === 'object' &&
          mcpServers !== null &&
          (mcpServers as Record<string, unknown>).codacy !== undefined
        ) {
          Logger.debug('MCP configuration found through VS Code API', 'MCP')
          return true
        }
      }
    } catch (apiError) {
      Logger.debug(`VS Code API check failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`, 'MCP')
    }

    // Otherwise, check configuration files directly
    const ideConfig = getCorrectMcpConfig()
    const filePath = path.join(ideConfig.fileDir, ideConfig.fileName)

    if (!fs.existsSync(filePath)) {
      Logger.debug(`MCP configuration file not found: ${filePath}`, 'MCP')
      return false
    }

    const rawContent = fs.readFileSync(filePath, 'utf8')
    const cleanedContent = sanitizeJSON(rawContent)
    const config = JSON.parse(cleanedContent)

    const hasConfig = get(config, `${ideConfig.configAccessor}.codacy`) !== undefined
    Logger.debug(`MCP configuration ${hasConfig ? 'found' : 'not found'} in config file`, 'MCP')
    return hasConfig
  } catch (error) {
    // Log the specific error for easier debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    Logger.debug(`Error checking MCP configuration: ${errorMessage}`, 'MCP')
    return false
  }
}

export async function configureGuardrails(cli?: CodacyCli, params?: RepositoryParams) {
  await cli?.install()
  await configureMCP(params)
}

async function installMCPForVSCode(server: MCPServerConfiguration): Promise<void> {
  // Implement the logic for installing MCP for VSCode using native User Settings API
  const mcpConfig = vscode.workspace.getConfiguration('mcp')
  let mcpServers = mcpConfig.get('servers')

  if (!mcpServers) {
    mcpServers = {}
  }

  if (mcpServers !== undefined && typeof mcpServers === 'object' && mcpServers !== null) {
    const modifiedConfig = set(mcpServers, 'codacy', server)
    await vscode.workspace.getConfiguration('mcp').update('servers', modifiedConfig, true)
  } else {
    Logger.error('MCP configuration not found in VS Code settings')
  }
}

function installMCPForOthers(server: MCPServerConfiguration) {
  // Implement the logic for installing MCP for Cursor and WindSurf
  const ideConfig = getCorrectMcpConfig()

  // Create directory if it doesn't exist
  const ideDir = ideConfig.fileDir

  if (!fs.existsSync(ideDir)) {
    fs.mkdirSync(ideDir)
  }

  const filePath = path.join(ideDir, ideConfig.fileName)

  // Read existing configuration if it exists
  let config = {}
  if (fs.existsSync(filePath)) {
    try {
      // Read and clean the file content
      const rawContent = fs.readFileSync(filePath, 'utf8')
      // Remove trailing commas - replace },} with }}
      const cleanedContent = sanitizeJSON(rawContent)
      config = JSON.parse(cleanedContent)
    } catch (parseError) {
      Logger.error(`Error parsing config: ${(parseError as Error).message}`)
      // If the existing file is invalid JSON, we'll create a new one
      config = {}
    }
  }

  // Set the codacyServer configuration at the correct nested level
  const modifiedConfig = set(config, `${ideConfig.configAccessor}.codacy`, server)

  fs.writeFileSync(filePath, JSON.stringify(modifiedConfig, null, 2))
}

const checkForNode = async (): Promise<void> => {
  try {
    const execAsync = promisify(exec)
    await execAsync('node --version')
  } catch (error) {
    throw new CodacyError('Node.js is not installed. Please install Node.js to use Codacy MCP.', error as Error, 'MCP')
  }
}

type MCPServerConfiguration = {
  command: string
  args: string[]
  env?: Record<string, string>
}

export async function configureMCP(params?: RepositoryParams, isUpdate = false) {
  const ide = getCurrentIDE()

  try {
    // Check for Node.js installation first
    await checkForNode()

    const apiToken = Config.apiToken

    // Prepare the Codacy server configuration
    const codacyServer: MCPServerConfiguration = {
      command: 'npx',
      args: ['-y', '@codacy/codacy-mcp@latest'],
      env: apiToken
        ? {
            CODACY_ACCOUNT_TOKEN: apiToken,
          }
        : undefined,
    }

    if (ide === 'vscode' || ide === 'insiders') {
      await installMCPForVSCode(codacyServer)
    } else if (ide === 'cursor' || ide === 'windsurf') {
      installMCPForOthers(codacyServer)
    } else {
      throw new CodacyError('Unsupported IDE for MCP configuration', undefined, 'MCP')
    }

    if (!isUpdate) {
      vscode.window.showInformationMessage('Codacy MCP server added successfully. Please restart the IDE.')
    }

    await createOrUpdateRules(params)
    if (ide === 'windsurf') {
      createWindsurfWorkflows()
    }
    updateMCPState()
  } catch (error) {
    throw new CodacyError('Failed to configure MCP server', error as Error, 'MCP')
  }
}

export async function updateMCPConfig(params?: RepositoryParams) {
  if (isMCPConfigured()) {
    await configureMCP(params, true)
  }
}
