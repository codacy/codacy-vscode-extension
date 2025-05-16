import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { Config } from '../common/config'
import { get, set } from 'lodash'
import { Repository } from '../api/client'
import { installCodacyCLI } from './installAnalysisCLI'
import Logger from '../common/logger'

interface Rule {
  when: string
  enforce: string[]
  scope: 'guardrails' | 'general'
}

interface RuleConfig {
  name: string
  description: string
  rules: Rule[]
}

const newRulesTemplate = (repository?: Repository, excludedScopes?: ('guardrails' | 'general')[]): RuleConfig => {
  const repositoryRules: Rule[] = []
  if (repository) {
    const { provider, owner: organization, name } = repository
    repositoryRules.push({
      when: 'using any tool that has either one of the following arguments: provider, organization or repository',
      enforce: [
        `use ${provider} for provider, ${organization} for organization and ${name} for repository, and avoid calling 'git remote -v' unless really necessary`,
      ],
      scope: 'general',
    })
  }

  const commonRules: Rule[] = [
    {
      when: 'after ANY successful edit_file or reapply tool call',
      scope: 'guardrails',
      enforce: [
        'IMMEDIATELY run codacy_cli_analyze tool for each edited file with:',
        '1. rootPath set to the workspace path',
        '2. file set to the edited file path',
        '3. no tool',
        'AT THE END run codacy_cli_analyze tool for trivy for the entire project with:',
        '1. rootPath set to the workspace path',
        '2. no file',
        '3. tool set to "trivy"',
        'If issues are found, propose fixes for them',
      ],
    },
    {
      when: 'after adding new dependencies, libraries or packages',
      scope: 'guardrails',
      enforce: [
        'IMMEDIATELY run codacy_cli_analyze tool for trivy for:',
        '1. rootPath set to the workspace path',
        '2. no file',
        '3. tool set to "trivy"',
        'If issues are found, propose fixes for them',
      ],
    },
    {
      when: 'a call to a Codacy tool that has repository or organization as parameter returns 404 error',
      scope: 'general',
      enforce: ['run codacy_setup_repository tool and then retry the action that failed'],
    },
    {
      when: 'user asks to create a rule',
      scope: 'general',
      enforce: [
        'To add a new rule for code analysis, follow these steps:',
        `1. **File Location & Name**
   - Create or edit a file named \`enigma.yaml\` in the root of the project.`,
        `2. **Rule Structure**
   - Each rule should be listed under the \`rules:\` key as an item in a YAML list.
   - Example rule format:
     \`\`\`yaml
     rules:
       - Id: python_hardcoded_password
         Pattern: $PASSWORD = $VALUE
         Description: Detects hardcoded passwords in string variable declarations
         Category: Security
         MetaTags:
           - Id: PASSWORD
             Regex: ...
           - Id: VALUE
             Regex: ...
         Languages:
           - python
     \`\`\``, 
          `3. **Pattern Field**
   - The \`Pattern\` is NOT a regex. It is a literal code pattern, but you can use MetaTags (like \`$PASSWORD\` or \`$VALUE\`) as placeholders.
   - MetaTags must start with a \`$\` and be defined in the \`MetaTags\` section.`,
          `4. **MetaTags**
   - Every MetaTag used in the \`Pattern\` must have a definition under \`MetaTags\`.
   - Each MetaTag must have an \`Id\` and a \`Regex\`.
   - The \`Regex\` must be Perl-compatible (PCRE), but **negative lookaheads are NOT supported**.`,
          `5. **Languages**
   - List the programming languages this rule applies to under \`Languages\`.`,
          `6. **Testing Your Rule**
   - After creating or editing a rule, test it by running the codacy_cli_analyze tool with:
     -- rootPath set to the project root
     -- no file
     -- tool set to "codacy-enigma-cli"
   - Check the output for any parsing errors and fix them if needed.`,
   `7. **Summary**
   - All rules must:
     - Be in \`enigma.yaml\` at the project root
     - Define all MetaTags used in the Pattern
     - Use only supported regex features in MetaTags
     - Be tested for parsing errors using the CLI`
      ]
    }
  ]

  return {
    name: 'Codacy Rules',
    description: 'Configuration for AI behavior when interacting with Codacy',
    rules: [...repositoryRules, ...commonRules].filter((rule) => !excludedScopes?.includes(rule.scope)),
  }
}

// Function to sanitize the JSON content to avoid trailing commas
const sanitizeJSON = (json: string): string => {
  return json.replace(/,([\s\r\n]*[}\]])/g, '$1')
}

const convertRulesToMarkdown = (rules: RuleConfig, existingContent?: string): string => {
  const codacyRules: string = existingContent?.split('---').filter((part) => part.includes(rules.name))[0] || ''
  const newCodacyRules = `\n# ${rules.name}\n${rules.description}\n${rules.rules
    .map((rule) => `## When ${rule.when}\n${rule.enforce.join('\n - ')}`)
    .join('\n\n')}\n`

  if (!existingContent) {
    return `---${newCodacyRules}---`
  }
  return codacyRules
    ? existingContent.replace(codacyRules, newCodacyRules)
    : existingContent + `---${newCodacyRules}---`
}

const rulesPrefixForMdc = `---
description: 
globs: 
alwaysApply: true
---
\n`

function getCorrectRulesInfo(): { path: string; format: string } {
  const ideInfo = getCurrentIDE()
  // Get the workspace folder path
  const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
  if (!workspacePath) {
    throw new Error('No workspace folder found')
  }
  if (ideInfo === 'cursor') {
    return { path: path.join(workspacePath, '.cursor', 'rules', 'codacy.mdc'), format: 'mdc' }
  }
  if (ideInfo === 'windsurf') {
    return { path: path.join(workspacePath, '.windsurfrules'), format: 'md' }
  }
  return { path: path.join(workspacePath, '.github', 'copilot-instructions.md'), format: 'md' }
}

const addRulesToGitignore = (rulesPath: string) => {
  const currentIDE = getCurrentIDE()
  const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ''
  const gitignorePath = path.join(workspacePath, '.gitignore')
  const relativeRulesPath = path.relative(workspacePath, rulesPath)
  const gitignoreContent = `\n\n#Ignore ${currentIDE} AI rules\n${relativeRulesPath}\n`
  let existingGitignore = ''

  if (fs.existsSync(gitignorePath)) {
    existingGitignore = fs.readFileSync(gitignorePath, 'utf8')

    if (!existingGitignore.split('\n').some((line) => line.trim() === relativeRulesPath.trim())) {
      fs.appendFileSync(gitignorePath, gitignoreContent)
      Logger.appendLine(`Added ${relativeRulesPath} to .gitignore`)
    }
  } else {
    fs.writeFileSync(gitignorePath, gitignoreContent)
    Logger.appendLine('Created .gitignore and added rules path')
  }
}
export async function createRules(repository?: Repository) {
  const analyzeGeneratedCode = vscode.workspace.getConfiguration().get('codacy.guardrails.analyzeGeneratedCode')

  const newRules = newRulesTemplate(repository, analyzeGeneratedCode === 'disabled' ? ['guardrails'] : [])

  try {
    const { path: rulesPath, format } = getCorrectRulesInfo()
    const isMdc = format === 'mdc'
    const dirPath = path.dirname(rulesPath)

    // Create directories if they don't exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }

    if (!fs.existsSync(rulesPath)) {
      fs.writeFileSync(rulesPath, `${isMdc ? rulesPrefixForMdc : ''}${convertRulesToMarkdown(newRules)}`)
      Logger.appendLine(`Created new rules file at ${rulesPath}`)
      addRulesToGitignore(rulesPath)
    } else {
      try {
        const existingContent = fs.readFileSync(rulesPath, 'utf8')

        fs.writeFileSync(rulesPath, convertRulesToMarkdown(newRules, existingContent))

        Logger.appendLine(`Updated rules in ${rulesPath}`)
      } catch (parseError) {
        Logger.error(`Error parsing existing rules file. Creating new one. Details: ${parseError}`)
        fs.writeFileSync(rulesPath, JSON.stringify(newRules, null, 2))
      }
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    Logger.error(`Failed to create rules: ${errorMessage}`)
    throw error
  }
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

  // Get platform-specific VS Code settings directory
  let vsCodeSettingsPath: string

  if (process.platform === 'win32') {
    vsCodeSettingsPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Code', 'User')
  } else if (process.platform === 'darwin') {
    vsCodeSettingsPath = path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User')
  } /* Linux */ else {
    // Could be WSL, but no way of getting the exact path on Windows from WSL
    if (isRunningInWsl()) {
      throw new Error('Running in WSL is not supported for MCP configuration via file')
    }
    vsCodeSettingsPath = path.join(os.homedir(), '.config', 'Code', 'User')
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
      if (currentIde === 'vscode') {
        const mcpServers = vscode.workspace.getConfiguration('mcp').get('servers')
        
        if (mcpServers !== undefined && 
            typeof mcpServers === 'object' && 
            mcpServers !== null && 
            (mcpServers as Record<string, unknown>).codacy !== undefined) {
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

export async function configureGuardrails(repository?: Repository) {
  await installCodacyCLI(repository)
  await configureMCP(repository)
}

function installMCPForVSCode(server: MCPServerConfiguration) {
  // Implement the logic for installing MCP for VSCode using native User Settings API
  const mcpConfig = vscode.workspace.getConfiguration('mcp')
  const mcpServers = mcpConfig.has('servers') ? mcpConfig.get('servers') : mcpConfig.update('servers', {}, true)


  if (mcpServers !== undefined && typeof mcpServers === 'object' && mcpServers !== null) {
    const modifiedConfig = set(mcpServers, 'codacy', server)
    vscode.workspace.getConfiguration('mcp').update('servers', modifiedConfig, true)
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

type MCPServerConfiguration = {
  command: string
  args: string[]
  env?: Record<string, string>
}

export async function configureMCP(repository?: Repository, isUpdate = false) {
  const generateRules = vscode.workspace.getConfiguration().get('codacy.guardrails.rulesFile')
  const ide = getCurrentIDE()

  try {
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

    if (ide === 'vscode') {
      installMCPForVSCode(codacyServer)
    }
    else if (ide === 'cursor' || ide === 'windsurf') {
      installMCPForOthers(codacyServer)
    }
    else {
      Logger.error('Unsupported IDE for MCP configuration')
      return
    }



    if (!isUpdate) {
      vscode.window.showInformationMessage('Codacy MCP server added successfully. Please restart the IDE.')
    }
    
    if (generateRules === 'enabled') {
      await createRules(repository)
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    vscode.window.showErrorMessage(`Failed to configure MCP server: ${errorMessage}`)
    Logger.error(`Failed to configure MCP server: ${errorMessage}`)
  }
}

export async function updateMCPConfig(repository?: Repository) {
  if (isMCPConfigured()) {
    await configureMCP(repository, true)
  }
}
