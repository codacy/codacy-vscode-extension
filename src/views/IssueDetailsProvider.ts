import * as vscode from 'vscode'
import { Api } from '../api'
import { Tools } from '../codacy/Tools'
import { CommitIssue } from '../api/client'

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

export const seeCliIssueDetailsCommand = async (issue?: import('../cli').ProcessedSarifResult) => {
  const tools = await Api.Tools.listTools()
  const toolUuid = tools.data.find((tool) => tool.name === issue?.tool)?.uuid

  if (!issue || !issue.rule || !toolUuid) return

  const uri = vscode.Uri.parse(`codacyIssue://${toolUuid}/${issue?.rule.id}`)

  vscode.commands.executeCommand('markdown.showPreviewToSide', uri)
}
