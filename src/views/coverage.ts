import * as vscode from 'vscode'
import { PullRequest } from '../git/PullRequest'
import { trimStart } from 'lodash'

const coverageDecorationType = vscode.window.createTextEditorDecorationType({
	overviewRulerColor: 'green',
	overviewRulerLane: vscode.OverviewRulerLane.Left,
	backgroundColor: new vscode.ThemeColor('diffEditor.insertedLineBackground')
});

const noCoverageDecorationType = vscode.window.createTextEditorDecorationType({
	overviewRulerColor: 'red',
	overviewRulerLane: vscode.OverviewRulerLane.Left,
	backgroundColor: new vscode.ThemeColor('diffEditor.removedLineBackground')
});

export async function decorateWithCoverage(
  editor: vscode.TextEditor,
  fileUri: vscode.Uri,
  pr: PullRequest | undefined
) {
  if (!pr) {
    return
  }

  if (!pr.displayCoverage) {
    editor.setDecorations(coverageDecorationType, [])
    editor.setDecorations(noCoverageDecorationType, [])
    return
  }

  const wsFolder = vscode.workspace.getWorkspaceFolder(fileUri) as vscode.WorkspaceFolder

  const relativeFilePath = trimStart(fileUri.fsPath.substring(wsFolder.uri.fsPath.length), '/')

  const coveredLines: vscode.DecorationOptions[] = []
  const nonCoveredLines: vscode.DecorationOptions[] = []

  const coverageHits = pr.coverage.get(relativeFilePath)
  coverageHits?.forEach((value) => {
    const r = editor.document.lineAt(parseInt(value.lineNumber) - 1).range
    if (value.hits > 0) {
      const decoration = { range: r, hoverMessage: `${value.hits} hits` }
      coveredLines.push(decoration)
    } else {
      const decoration = { range: r, hoverMessage: 'Not covered' }
      nonCoveredLines.push(decoration)
    }
  })

  editor.setDecorations(coverageDecorationType, coveredLines)
  editor.setDecorations(noCoverageDecorationType, nonCoveredLines)
}
