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

interface Rule {
  when?: string
  enforce: string[]
  scope: 'guardrails' | 'general'
}

interface RuleConfig {
  name: string
  description: string
  rules: Rule[]
}

const newRulesTemplate = (params?: RepositoryParams, excludedScopes?: ('guardrails' | 'general')[]): RuleConfig => {
  const repositoryRules: Rule[] = []
  if (params) {
    const { provider, organization, repository } = params
    repositoryRules.push({
      when: 'using any tool that accepts the arguments: `provider`, `organization`, or `repository`',
      enforce: [
        'ALWAYS use:',
        `- provider: ${provider}`,
        `- organization: ${organization}`,
        `- repository: ${repository}`,
        'Avoid calling `git remote -v` unless really necessary',
      ],
      scope: 'general',
    })
  }

  const codacyCLISettingsPath = path.join(
    vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '',
    '.codacy',
    'codacy.yaml'
  )

  const enigmaRules: Rule[] = []
  if (fs.existsSync(codacyCLISettingsPath)) {
    const codacyCLITools = fs.readFileSync(codacyCLISettingsPath, 'utf8')
    if (codacyCLITools.includes('enigma')) {
      enigmaRules.push({
        when: 'When user asks to create a rule',
        scope: 'general',
        enforce: [
          'To add a new rule for code analysis, follow these steps:',
          '- Create or edit a file named `enigma.yaml` in the root of the project.',
          '- Each rule should be listed under the `rules:` key as an item in a YAML list.',
          `- Example rule format:
  \`\`\`yaml
  rules:,
    - Id: python_hardcoded_password,
      Pattern: $PASSWORD = $VALUE,
      Description: Detects hardcoded passwords in string variable declarations,
      Category: Security,
      MetaTags:,
        - Id: PASSWORD,
          Regex: ...,
        - Id: VALUE,
          Regex: ...,
      Languages:,
        - python,
  \`\`\``,
          'Pattern Field',
          '- The `Pattern` is NOT a regex. It is a literal code pattern, but you can use MetaTags (like `$PASSWORD` or `$VALUE`) as placeholders.',
          '- MetaTags must start with a `$` and be defined in the `MetaTags` section.',
          'MetaTags',
          '- Every MetaTag used in the `Pattern` must have a definition under `MetaTags`.',
          '- Each MetaTag must have an `Id` and a `Regex`.',
          '- The `Regex` must be Perl-compatible (PCRE), but negative lookaheads are NOT supported. Please always wrap in double quotes.',
          'Languages:  List the programming languages this rule applies to under `Languages`.',
          'Testing Your Rule: After creating or editing a rule, test it by running the codacy_cli_analyze tool with:',
          '- rootPath set to the project root',
          '- no file',
          '- tool set to "codacy-enigma-cli"',
          'Check the output for any parsing errors and fix them if needed.',
          'Summary - All rules must:',
          '- Be in `enigma.yaml` at the project root',
          '- Define all MetaTags used in the Pattern',
          '- Use only supported regex features in MetaTags',
          '- Be tested for parsing errors using the CLI',
        ],
      })
    }
  }

  const commonRules: Rule[] = [
    {
      when: 'After ANY successful `edit_file` or `reapply` operation',
      enforce: [
        "YOU MUST IMMEDIATELY run the `codacy_cli_analyze` tool from Codacy's MCP Server for each file that was edited, with:",
        '- `rootPath`: set to the workspace path',
        '- `file`: set to the path of the edited file',
        '- `tool`: leave empty or unset',
        'If any issues are found in the new edits, propose and apply fixes for them.',
        '> NOTE: Failure to follow this rule is considered a critical error.',
      ],
      scope: 'guardrails',
    },
    {
      when: 'CRITICAL: Dependencies and Security Checks',
      enforce: [
        'IMMEDIATELY after ANY of these actions:',
        '- Running npm/yarn/pnpm install',
        '- Adding dependencies to package.json',
        '- Adding requirements to requirements.txt',
        '- Adding dependencies to pom.xml',
        '- Adding dependencies to build.gradle',
        '- Any other package manager operations',
        'You MUST run the `codacy_cli_analyze` tool with:',
        '- `rootPath`: set to the workspace path',
        '- `tool`: set to "trivy"',
        '- `file`: leave empty or unset',
        'If any vulnerabilities are found because of the newly added packages:',
        '- Stop all other operations',
        '- Propose and apply fixes for the security issues',
        '- Only continue with the original task after security issues are resolved',
        'EXAMPLE:',
        '- After: npm install react-markdown',
        '- Do: Run codacy_cli_analyze with trivy',
        '- Before: Continuing with any other tasks',
      ],
      scope: 'guardrails',
    },
    {
      enforce: [
        'Repeat the relevant steps for each modified file.',
        '"Propose fixes" means to both suggest and, if possible, automatically apply the fixes.',
        'You MUST NOT wait for the user to ask for analysis or remind you to run the tool.',
        'Do not run `codacy_cli_analyze` looking for changes in duplicated code or code complexity metrics.',
        'Do not run `codacy_cli_analyze` looking for changes in code coverage.',
        'Do not try to manually install Codacy CLI using either brew, npm, npx, or any other package manager.',
        "If the Codacy CLI is not installed, just run the `codacy_cli_analyze` tool from Codacy's MCP Server.",
        'When calling `codacy_cli_analyze`, only send provider, organization and repository if the project is a git repository.',
      ],
      scope: 'guardrails',
    },
    {
      when: 'Whenever a call to a Codacy tool that uses `repository` or `organization` as a parameter returns a 404 error',
      enforce: [
        'Offer to run the `codacy_setup_repository` tool to add the repository to Codacy',
        'If the user accepts, run the `codacy_setup_repository` tool',
        'Do not ever try to run the `codacy_setup_repository` tool on your own',
        'After setup, immediately retry the action that failed (only retry once)',
      ],
      scope: 'general',
    },
  ]

  return {
    name: 'Codacy Rules',
    description: "Configuration for AI behavior when interacting with Codacy's MCP Server",
    rules: [...repositoryRules, ...commonRules, ...enigmaRules].filter((rule) => !excludedScopes?.includes(rule.scope)),
  }
}

// Function to sanitize the JSON content to avoid trailing commas
const sanitizeJSON = (json: string): string => {
  return json.replace(/,([\s\r\n]*[}\]])/g, '$1')
}

const convertRulesToMarkdown = (rules: RuleConfig, existingContent?: string): string => {
  const newCodacyRules = `\n# ${rules.name}\n${rules.description}\n\n${rules.rules
    .map(
      (rule) =>
        `${rule.when ? `## ${rule.when}\n` : '## General\n'}${rule.enforce
          .map((e) => (e.startsWith('-') ? ` ${e}` : `- ${e}`))
          .join('\n')}`
    )
    .join('\n\n')}\n`

  if (!existingContent) {
    return `---${newCodacyRules}---`
  }

  const existingRules = existingContent?.split('---')

  return existingRules.map((content) => (content.indexOf(rules.name) >= 0 ? newCodacyRules : content)).join('---')
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

export function updateMCPState() {
  const isConfigured = isMCPConfigured()
  vscode.commands.executeCommand('setContext', 'codacy:mcpConfigured', isConfigured)
}

export async function createOrUpdateRules(params?: RepositoryParams) {
  const analyzeGeneratedCode = vscode.workspace.getConfiguration().get('codacy.guardrails.analyzeGeneratedCode')
  const generateRules = vscode.workspace.getConfiguration().get('codacy.guardrails.rulesFile')

  if (generateRules === 'disabled') return

  const newRules = newRulesTemplate(params, analyzeGeneratedCode === 'disabled' ? ['guardrails'] : [])

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
      installMCPForVSCode(codacyServer)
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
  } catch (error) {
    throw new CodacyError('Failed to configure MCP server', error as Error, 'MCP')
  }
}

export async function updateMCPConfig(params?: RepositoryParams) {
  if (isMCPConfigured()) {
    await configureMCP(params, true)
  }
}
