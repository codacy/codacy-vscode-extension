import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { Config } from '../common/config'

export function isMCPConfigured(): boolean {
  const isCursor = vscode.env.appName.toLowerCase().includes('cursor')
  try {
    const cursorMcpPath = path.join(os.homedir(), '.cursor', 'mcp.json')
    const windsurfMcpPath = path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json')

    const ideConfigFile = isCursor ? cursorMcpPath : windsurfMcpPath
    if (!fs.existsSync(ideConfigFile)) {
      return false
    }

    const config = JSON.parse(fs.readFileSync(ideConfigFile, 'utf8'))
    return config?.mcpServers?.codacy !== undefined
  } catch (error) {
    // If there's any error reading or parsing the file, assume it's not configured
    return false
  }
}

export async function configureMCP() {
  const isCursor = vscode.env.appName.toLowerCase().includes('cursor')
  try {
    const apiToken = Config.apiToken

    if (!apiToken) {
      throw new Error('Codacy API token not found in settings')
    }

    // Create .cursor directory if it doesn't exist
    const ideDir = isCursor ? path.join(os.homedir(), '.cursor') : path.join(os.homedir(), '.codeium', 'windsurf')

    if (!fs.existsSync(ideDir)) {
      fs.mkdirSync(ideDir)
    }

    const mcpPath = path.join(ideDir, isCursor ? 'mcp.json' : 'mcp_config.json')

    // Prepare the Codacy server configuration
    const codacyServer = {
      command: 'npx',
      args: ['-y', '@codacy/codacy-mcp@latest'],
      env: {
        CODACY_ACCOUNT_TOKEN: apiToken,
      },
    }

    // Read existing configuration if it exists
    let mcpConfig = { mcpServers: {} }
    if (fs.existsSync(mcpPath)) {
      try {
        const existingConfig = JSON.parse(fs.readFileSync(mcpPath, 'utf8'))
        mcpConfig = {
          mcpServers: {
            ...(existingConfig.mcpServers || {}),
            codacy: codacyServer,
          },
        }
      } catch (parseError) {
        // If the existing file is invalid JSON, we'll create a new one
        mcpConfig = {
          mcpServers: {
            codacy: codacyServer,
          },
        }
      }
    } else {
      mcpConfig = {
        mcpServers: {
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
