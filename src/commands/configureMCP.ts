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
        'AT THE END run codacy_cli_analyze tool for Trivy for the entire project with:',
        '1. rootPath set to the workspace path',
        '2. no file',
        '3. tool set to Trivy',
        'If issues are found, propose fixes for them',
      ],
    },
    {
      when: 'after adding new dependencies, libraries or packages',
      scope: 'guardrails',
      enforce: [
        'IMMEDIATELY run codacy_cli_analyze tool for Trivy for:',
        '1. rootPath set to the workspace path',
        '2. no file',
        '3. tool set to Trivy',
        'If issues are found, propose fixes for them',
      ],
    },
    {
      when: 'a call to a Codacy tool that has repository or organization as parameter returns 404 error',
      scope: 'general',
      enforce: ['run codacy_setup_repository tool and then retry the action that failed'],
    },
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
export async function createRules(repository: Repository) {
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

    return get(config, ideConfig.configAccessor) !== undefined
  } catch {
    // If there's any error reading or parsing the file, assume it's not configured
    return false
  }
}

export async function configureMCP(repository: Repository) {
  const generateRules = vscode.workspace.getConfiguration().get('codacy.guardrails.rulesFile')
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
        const cleanedContent = sanitizeJSON(rawContent)
        config = JSON.parse(cleanedContent)
      } catch (parseError) {
        Logger.error(`Error parsing config: ${(parseError as Error).message}`)
        // If the existing file is invalid JSON, we'll create a new one
        config = {}
      }
    }

    // Set the codacyServer configuration at the correct nested level
    const modifiedConfig = set(config, `${ideConfig.configAccessor}.codacy`, codacyServer)

    fs.writeFileSync(filePath, JSON.stringify(modifiedConfig, null, 2))

    vscode.window.showInformationMessage('Codacy MCP server added successfully. Please restart the IDE.')
    if (generateRules === 'enabled') {
      await createRules(repository)
    }
    await installCodacyCLI(repository)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    vscode.window.showErrorMessage(`Failed to configure MCP server: ${errorMessage}`)
  }
}
