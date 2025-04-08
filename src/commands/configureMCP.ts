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
    // Navigate through the nested structure using the configAccessor path
    const path = ideConfig.configAccessor.split('.')
    let current = config
    for (const segment of path) {
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

    // Helper function to set nested value
    const setNestedValue = (obj: Record<string, unknown>, accessor: string) => {
      // Create a deep copy of the object to avoid mutations
      const result = JSON.parse(JSON.stringify(obj))
      const path = accessor.split('.')
      let current = result

      // Build the path if it doesn't exist
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = current[path[i]] || {}
        current = current[path[i]] as Record<string, unknown>
      }

      const lastKey = path[path.length - 1]
      // Ensure we preserve the existing structure at the final level
      current[lastKey] = {
        ...current[lastKey], // Preserve all existing keys at this level
        codacy: codacyServer,
      }

      return result
    }

    // Set the codacyServer configuration at the correct nested level
    const modifiedConfig = setNestedValue(config, ideConfig.configAccessor)

    fs.writeFileSync(filePath, JSON.stringify(modifiedConfig, null, 2))

    vscode.window.showInformationMessage('Codacy MCP server added successfully')
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    vscode.window.showErrorMessage(`Failed to configure MCP server: ${errorMessage}`)
  }
}
