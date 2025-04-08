import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { Config } from '../common/config'
import { set } from 'lodash'

function getCurrentIDE(): string {
  const isCursor = vscode.env.appName.toLowerCase().includes('cursor')
  const isWindsurf = vscode.env.appName.toLowerCase().includes('windsurf')
  if (isCursor) return 'cursor'
  if (isWindsurf) return 'windsurf'
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

  return {
    fileDir: path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User'),
    fileName: 'settings.json',
    configAccessor: 'mcp.servers',
  }
}

export function isMCPConfigured(): boolean {
  try {
    const ideConfig = getCorrectMcpConfig()
    const filePath = path.join(ideConfig.fileDir, ideConfig.fileName)
    if (!fs.existsSync(filePath)) {
      return false
    }

    const config = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    // Navigate through the nested structure using the configAccessor path
    const accessorParts = ideConfig.configAccessor.split('.')
    let current = config
    for (const segment of accessorParts) {
      current = current?.[segment]
      if (!current) return false
    }
    return current?.codacy !== undefined
  } catch (error) {
    // If there's any error reading or parsing the file, assume it's not configured
    return false
  }
}

export async function configureMCP() {
  const ideConfig = getCorrectMcpConfig()
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

    const filePath = path.join(ideDir, ideConfig.fileName)

    // Prepare the Codacy server configuration
    const codacyServer = {
      command: 'npx',
      args: ['-y', '@codacy/codacy-mcp@latest'],
      env: {
        CODACY_ACCOUNT_TOKEN: apiToken,
      },
    }

    // Read existing configuration if it exists
    let config = {}
    if (fs.existsSync(filePath)) {
      try {
        // Read and clean the file content
        const rawContent = fs.readFileSync(filePath, 'utf8')
        // Remove trailing commas - replace },} with }}
        const cleanedContent = rawContent.replace(/,([\s\r\n]*[}\]])/g, '$1')
        config = JSON.parse(cleanedContent)
      } catch (parseError) {
        console.log('Error parsing config:', parseError)
        // If the existing file is invalid JSON, we'll create a new one
        config = {}
      }
    }

    // Set the codacyServer configuration at the correct nested level
    const modifiedConfig = set(config, ideConfig.configAccessor, { codacy: codacyServer })

    fs.writeFileSync(filePath, JSON.stringify(modifiedConfig, null, 2))

    vscode.window.showInformationMessage('Codacy MCP server added successfully')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    vscode.window.showErrorMessage(`Failed to configure MCP server: ${errorMessage}`)
  }
}
