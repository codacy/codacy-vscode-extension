import * as vscode from 'vscode'
import { Api } from '../api'
import { Tools } from '../codacy/Tools'
import { CodingStandardInfo, CommitIssue } from '../api/client'
import Logger from '../common/logger'
import { ProcessedSarifResult } from '../cli'
import { RepositoryParams } from '../git/CodacyCloud'
import { handleError, CodacyError } from '../common/utils'
import { hasPermission } from './hasPermissions'
import { getCurrentPendingCount } from './SetupView'
import { showPatternInStandardView } from './PatternInStandardView'
import { CodacyCli } from '../cli/CodacyCli'

export class IssueDetailsProvider {
  async provideTextDocumentContent(uri: vscode.Uri) {
    const toolUuid = uri.authority
    const patternId = uri.path.substring(1)

    const { data: pattern } = await Api.Tools.getPattern(toolUuid, patternId)
    const tool = Tools.getTool(toolUuid)

    // remove h1 and h2 from explanation's markdown
    const curatedExplanation = pattern.explanation?.replace(/^#{1,2}\s.*\n/, '')

    const explanationEmptyState = `At Codacy we strive to provide great descriptions for our patterns. With good explanations developers can better understand issues and even learn how to fix them. 
   
For this tool we are not yet meeting this standard but you can help us improve the docs. To know more, take a look at our [tool documentation guide](https://docs.codacy.com/related-tools/tool-developer-guide/#documentation).

You can also visit the tool's website to find useful tips about the patterns.`

    const rationale = pattern.rationale
      ? `### Why is this a problem?
${pattern.rationale}`
      : ''
    const solution = pattern.solution
      ? `### How to fix it
${pattern.solution}`
      : ''

    const badExamples = pattern.badExamples?.length
      ? `### Bad examples
${pattern.badExamples.map((example) => `\`\`\`\n ${example}\n\`\`\``)}`
      : ''
    const goodExamples = pattern.goodExamples?.length
      ? `### Good examples
${pattern.goodExamples.map((example) => `\`\`\`\n ${example}\n\`\`\``)}`
      : ''

    const examples =
      pattern.badExamples?.length || pattern.goodExamples?.length
        ? `### Examples
${badExamples}
${goodExamples}`
        : ''

    return `
## ${pattern.title}
${rationale}

${solution}

${examples}

## ${tool?.name}'s documentation
${pattern.explanation ? curatedExplanation : explanationEmptyState}

---

Source: [${tool?.name}](${tool?.documentationUrl})
        `
  }
}

export const seeIssueDetailsCommand = async (issue?: CommitIssue) => {
  const uri = vscode.Uri.parse(`codacyIssue://${issue?.toolInfo.uuid}/${issue?.patternInfo.id}`)

  vscode.commands.executeCommand('markdown.showPreviewToSide', uri)
}

export const seeCliIssueDetailsCommand = async (issue?: ProcessedSarifResult) => {
  const tools = await Api.Tools.listTools()
  const toolUuid = tools.data.find((tool) => tool.name === issue?.tool)?.uuid

  if (!issue || !issue.rule || !toolUuid) {
    vscode.window.showErrorMessage('Unable to show issue details: missing tool or rule information.')
    Logger.error('Unable to show issue details: missing tool or rule information.')
    return
  }

  const uri = vscode.Uri.parse(`codacyIssue://${toolUuid}/${issue?.rule.id}`)

  vscode.commands.executeCommand('markdown.showPreviewToSide', uri)
}

export const disablePatternCommand = async (issue?: CommitIssue, params?: RepositoryParams, cli?: CodacyCli) => {
  if (!issue || !params) {
    vscode.window.showErrorMessage(
      "We couldn't disable this pattern because we're missing repository information. If this keeps happening, reach out to support."
    )
    Logger.error('[Codacy API] Unable to disable pattern: missing repository information')
    return
  }

  const pendingCount = getCurrentPendingCount()

  // If pendingCount is undefined, assume setup is not complete (safer default)
  // If pendingCount > 0, setup is incomplete
  if (pendingCount === undefined || pendingCount > 0) {
    const action = await vscode.window.showInformationMessage(
      'Complete your Codacy setup to disable patterns.',
      'Complete setup'
    )

    if (action === 'Complete setup') {
      await vscode.commands.executeCommand('workbench.view.extension.codacy-main')
    }
    return
  }

  const { provider, organization, repository } = params

  let codingStandards: CodingStandardInfo[] = []
  let hasPermissions = false

  try {
    const { data: repositoryData } = await Api.Repository.getRepository(provider, organization, repository)
    hasPermissions = await hasPermission(provider, organization, 'admin', repositoryData.permission)
    codingStandards = repositoryData.standards
  } catch (error) {
    Logger.error(
      `[Codacy API] Failed to check repository information: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
    if (error instanceof CodacyError) {
      handleError(error, false)
    } else {
      handleError(new CodacyError('Failed to check repository information', error as Error, 'API'), false)
    }
    return
  }

  if (!hasPermissions) {
    const action = await vscode.window.showInformationMessage(
      "You don't have permission to disable this pattern. Contact your admin or  ask for permissions.",
      'View permissions'
    )

    if (action === 'View permissions') {
      // Open Codacy to view permissions
      const permissionsUrl = `https://app.codacy.com/organizations/${provider}/${organization}/settings/permissions`
      await vscode.env.openExternal(vscode.Uri.parse(permissionsUrl))
    }
    return
  }

  // If coding standard is applied, user can't disable patterns at repository level
  if (codingStandards.length > 0) {
    showPatternInStandardView({ provider, organization, repository }, issue, codingStandards, cli)
    return
  }

  const toolUuid = issue.toolInfo.uuid
  const patternId = issue.patternInfo.id

  try {
    await Api.Analysis.configureTool(provider, organization, repository, toolUuid, {
      patterns: [
        {
          id: patternId,
          enabled: false,
        },
      ],
    })

    const action = await vscode.window.showInformationMessage(
      'Pattern was successfully disabled in the cloud. This might take some time to reflect in the UI.',
      'Undo'
    )
    Logger.appendLine(
      `[Codacy API] Pattern "${patternId}" disabled for repository ${provider}/${organization}/${repository}`
    )

    if (action === 'Undo') {
      try {
        await Api.Analysis.configureTool(provider, organization, repository, toolUuid, {
          patterns: [
            {
              id: patternId,
              enabled: true,
            },
          ],
        })
        vscode.window.showInformationMessage('Pattern re-enabled successfully.')
        Logger.appendLine(
          `[Codacy API] Pattern "${patternId}" re-enabled for repository ${provider}/${organization}/${repository}`
        )
      } catch (error) {
        Logger.error(
          `[Codacy API] Failed to re-enable pattern "${patternId}": ${error instanceof Error ? error.message : 'Unknown error'}`
        )
        if (error instanceof CodacyError) {
          handleError(error, false)
        } else {
          handleError(new CodacyError('Failed to re-enable pattern', error as Error, 'API'), false)
        }
      }
    }
  } catch (error) {
    Logger.error(
      `[Codacy API] Failed to disable pattern "${patternId}": ${error instanceof Error ? error.message : 'Unknown error'}`
    )
    if (error instanceof CodacyError) {
      handleError(error, false)
    } else {
      handleError(new CodacyError('Failed to disable pattern', error as Error, 'API'), false)
    }
  }
}
