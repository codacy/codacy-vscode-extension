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

    return `
## ${pattern.title}
${pattern.description}

${curatedExplanation}

---

Source: [${tool?.name}](${tool?.documentationUrl})
        `
  }
}

export const seeIssueDetailsCommand = async (issue?: CommitIssue) => {
  const uri = vscode.Uri.parse(`codacyIssue://${issue?.toolInfo.uuid}/${issue?.patternInfo.id}`)

  vscode.commands.executeCommand('markdown.showPreviewToSide', uri)
}
