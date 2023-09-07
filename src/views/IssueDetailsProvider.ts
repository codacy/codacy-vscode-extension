import * as vscode from 'vscode'
import { Api } from '../api'
import { PullRequestIssue } from '../git/PullRequest'
import { Tools } from '../codacy/Tools'

export class IssueDetailsProvider {
  async provideTextDocumentContent(uri: vscode.Uri) {
    const toolUuid = uri.authority
    const patternId = uri.path.substring(1)

    const { data: pattern } = await Api.Tools.getPattern(toolUuid, patternId)
    const tool = Tools.getTool(toolUuid)

    // remove h1 and h2 from explanation's markdown
    const curatedExplanation = pattern.explanation?.replace(/^#{1,2}\s.*\n/, '')

    return `
## ${pattern.title}
${pattern.description}

${curatedExplanation}

---

Source: [${tool?.name}](${tool?.documentationUrl})
        `
  }
}

export const seeIssueDetailsCommand = async (issue?: PullRequestIssue) => {
  const uri = vscode.Uri.parse(`codacyIssue://${issue?.commitIssue.toolInfo.uuid}/${issue?.commitIssue.patternInfo.id}`)

  vscode.commands.executeCommand('markdown.showPreviewToSide', uri)
}
