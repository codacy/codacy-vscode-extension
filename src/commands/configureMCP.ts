import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { Config } from '../common/config'

function getCurrentIDE(): string {
  const isCursor = vscode.env.appName.toLowerCase().includes('cursor')
  const isWindsurf = vscode.env.appName.toLowerCase().includes('windsurf')
  if (isCursor) return 'cursor'
  if (isWindsurf) return 'windsurf'
  return 'vscode'
}
function getCorrectMcpPath(): {
  filePath: string
  fileDir: string
  fileName: string
  configAccessor: string
} {
  const currentIde = getCurrentIDE()

  if (currentIde === 'cursor')
    return {
      filePath: path.join(os.homedir(), '.cursor', 'mcp.json'),
      fileDir: path.join(os.homedir(), '.cursor'),
      fileName: 'mcp.json',
      configAccessor: 'mcpServers',
    }
  if (currentIde === 'windsurf')
    return {
      filePath: path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json'),
      fileDir: path.join(os.homedir(), '.codeium', 'windsurf'),
      fileName: 'mcp_config.json',
      configAccessor: 'mcpServers',
    }

  return {
    filePath: path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'settings.json'),
    fileDir: path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User'),
    fileName: 'settings.json',
    configAccessor: 'mcp.servers',
  }
}

export function isMCPConfigured(): boolean {
  try {
    const ideConfig = getCorrectMcpPath()
    if (!fs.existsSync(ideConfig.filePath)) {
      return false
    }

    const config = JSON.parse(fs.readFileSync(ideConfig.filePath, 'utf8'))
    return config?.[ideConfig.configAccessor]?.codacy !== undefined
  } catch (error) {
    // If there's any error reading or parsing the file, assume it's not configured
    return false
  }
}

export async function configureMCP() {
  const ideConfig = getCorrectMcpPath()
  try {
    const apiToken = Config.apiToken

    if (!apiToken) {
      throw new Error('Codacy API token not found in settings')
    }

    // Create directory if it doesn't exist
    const ideDir = ideConfig.fileDir

    if (!fs.existsSync(ideDir)) {
      fs.mkdirSync(ideDir)
    }

    const mcpPath = path.join(ideDir, ideConfig.fileName)

    // Prepare the Codacy server configuration
    const codacyServer = {
      command: 'npx',
      args: ['-y', '@codacy/codacy-mcp@latest'],
      env: {
        CODACY_ACCOUNT_TOKEN: apiToken,
      },
    }

    // Read existing configuration if it exists
    let mcpConfig = { [ideConfig.configAccessor]: {} }
    if (fs.existsSync(mcpPath)) {
      try {
        const existingConfig = JSON.parse(fs.readFileSync(mcpPath, 'utf8'))
        mcpConfig = {
          ...existingConfig,
          [ideConfig.configAccessor]: {
            ...(existingConfig[ideConfig.configAccessor] || {}),
            codacy: codacyServer,
          },
        }
      } catch (parseError) {
        // If the existing file is invalid JSON, we'll create a new one
        mcpConfig = {
          [ideConfig.configAccessor]: {
            codacy: codacyServer,
          },
        }
      }
    } else {
      mcpConfig = {
        [ideConfig.configAccessor]: {
          codacy: codacyServer,
        },
      }
    }

    fs.writeFileSync(mcpPath, JSON.stringify(mcpConfig, null, 2))

    vscode.window.showInformationMessage('Codacy MCP server added successfully')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    vscode.window.showErrorMessage(`Failed to configure MCP server: ${errorMessage}`)
  }
}
