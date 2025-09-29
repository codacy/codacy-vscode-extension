import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import { RepositoryParams } from '../git/CodacyCloud'
import { getCurrentIDE } from './configureMCP'
import Logger from '../common/logger'

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

interface RuleConfig {
  name: string
  description: string
  rules: Rule[]
}

export const newRulesTemplate = (
  params?: RepositoryParams,
  excludedScopes?: ('guardrails' | 'general')[]
): RuleConfig => {
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
      when: 'CRITICAL: After ANY successful `edit_file` or `reapply` operation',
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
      when: 'When you tried to run the `codacy_cli_analyze` tool and the Codacy CLI is not installed',
      enforce: [
        "Ask the user 'Codacy CLI is not installed. Would you like me to install it now?'",
        'If the user responds with "yes", run the `codacy_cli_install` tool and then continue with the original task',
        'If the user responds with "no", instruct the user that they can disable automatic analysis in the extension settings',
        'Wait for the user to respond before proceeding with any other actions',
      ],
      scope: 'guardrails',
    },
    {
      when: 'After every response',
      enforce: [
        "If you made any file edits in this conversation, verify you ran `codacy_cli_analyze` tool from Codacy's MCP Server ",
      ],
      scope: 'guardrails',
    },
    {
      when: 'When there are no Codacy MCP Server tools available, or the MCP Server is not reachable',
      enforce: [
        'Suggest the user the following troubleshooting steps:',
        '- Try to reset the MCP on the extension',
        '- If the user is using VSCode, suggest them to review their Copilot > MCP settings in Github, under their organization or personal account. Refer them to Settings > Copilot > Enable MCP servers in Copilot. Suggested URL (https://github.com/settings/copilot/features) or https://github.com/organizations/{organization-name}/settings/copilot/features (This can only be done by their organization admins / owners)',
        'If none of the above steps work, suggest the user to contact Codacy support',
      ],
      scope: 'guardrails',
    },
    {
      when: 'Trying to call a tool that needs a rootPath as a parameter',
      enforce: ['Always use the standard, non-URL-encoded file system path'],
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
        'Complexity metrics is different from complexity issues. When trying to fix complexity in a repository or file, focus on solving the complexity issues and ignore the complexity metric.',
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

const getPrefixForMarkdown = (ide: string, description: string) => {
  if (ide === 'cursor') {
    return `---
    description: ${description}
    globs: 
    alwaysApply: true\n---\n`
  }
  if (ide === 'vscode') {
    return `---
    description: ${description}
    applyTo: '**'\n---\n`
  }
  return ''
}

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
  return { path: path.join(workspacePath, '.github', 'instructions', 'codacy.instructions.md'), format: 'md' }
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

export async function checkRulesFile() {
  const { path: rulesPath } = getCorrectRulesInfo()
  try {
    if (fs.existsSync(rulesPath)) {
      await vscode.commands.executeCommand('setContext', 'codacy:guardrailsRulesFile', true)
      return true
    } else {
      await vscode.commands.executeCommand('setContext', 'codacy:guardrailsRulesFile', false)
      return false
    }
  } catch (error) {
    Logger.error(`Error checking if rules file exists: ${error}`)
    return false
  }
}

export async function createOrUpdateRules(params?: RepositoryParams) {
  const analyzeGeneratedCode = vscode.workspace.getConfiguration().get('codacy.guardrails.analyzeGeneratedCode')

  const newRules = newRulesTemplate(params, analyzeGeneratedCode === 'disabled' ? ['guardrails'] : [])

  try {
    const { path: rulesPath } = getCorrectRulesInfo()
    const currentIDE = getCurrentIDE()
    const dirPath = path.dirname(rulesPath)

    // Create directories if they don't exist
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }

    if (!fs.existsSync(rulesPath)) {
      fs.writeFileSync(
        rulesPath,
        `${getPrefixForMarkdown(currentIDE, newRules.description)}${convertRulesToMarkdown(newRules)}`
      )
      Logger.appendLine(`Created new rules file at ${rulesPath}`)
      checkRulesFile()
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
