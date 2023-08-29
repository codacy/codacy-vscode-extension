import * as vscode from 'vscode'
import { groupBy, startCase } from 'lodash'
import { RepositoryManager } from '../git/RepositoryManager'
import { PullRequest, PullRequestIssue } from '../git/PullRequest'
import { GitProvider } from '../git/GitProvider'

const patternSeverityToDiagnosticSeverity = (severity: 'Info' | 'Warning' | 'Error'): vscode.DiagnosticSeverity => {
  switch (severity) {
    case 'Info':
      return vscode.DiagnosticSeverity.Information
    case 'Warning':
      return vscode.DiagnosticSeverity.Warning
    case 'Error':
      return vscode.DiagnosticSeverity.Error
    default:
      return vscode.DiagnosticSeverity.Error
  }
}

export class IssueDiagnostic extends vscode.Diagnostic {
  constructor(readonly issue: PullRequestIssue) {
    const line = issue.commitIssue.lineNumber - 1

    // initial column = amount of blank spaces at the beginning of the line
    const startCol = issue.commitIssue.lineText.match(/^(\s*)/)?.[1].length || 0
    const endCol = startCol + issue.commitIssue.lineText.trim().length

    const message = `[${startCase(issue.commitIssue.patternInfo.category)}${
      issue.commitIssue.patternInfo.subCategory ? ` - ${startCase(issue.commitIssue.patternInfo.subCategory)}` : ''
    }] ${issue.commitIssue.message}`
    const severity = patternSeverityToDiagnosticSeverity(issue.commitIssue.patternInfo.severityLevel)

    const range = new vscode.Range(line, startCol, line, endCol)

    super(range, message, severity)

    this.source = `Codacy [${issue.commitIssue.toolInfo.name.replace('Codacy ', '')}]`
    this.code = issue.uri
      ? {
          value: issue.commitIssue.patternInfo.id,
          target: issue.uri,
        }
      : undefined
  }
}

export class ProblemsDiagnosticCollection implements vscode.Disposable {
  private _collection: vscode.DiagnosticCollection = vscode.languages.createDiagnosticCollection('codacy')
  private _pr: PullRequest | undefined

  constructor(private readonly _repositoryManager: RepositoryManager) {
    _repositoryManager.onDidUpdatePullRequest((pr) => {
      this._pr = pr
      const newIssues = pr?.issues.filter((issue) => issue.deltaType === 'Added') || []
      if (newIssues.length > 0) {
        this.load(newIssues)
      } else {
        this.clear()
      }
    })

    GitProvider.instance?.onDidChangeTextDocument((e) => {
      this.updatePositions(e.document)
    })
  }

  public load(issues: PullRequestIssue[]) {
    // clear previous diagnostics
    this._collection.clear()

    // group issues by file using lodash
    const issuesByFile = groupBy(issues, (issue) => issue.commitIssue.filePath)
    const baseUri = this._repositoryManager.rootUri?.path

    // create diagnostics for each file
    for (const [filePath, issues] of Object.entries(issuesByFile)) {
      const diagnostics = issues.map((issue) => new IssueDiagnostic(issue))
      this._collection.set(vscode.Uri.file(`${baseUri}/${filePath}`), diagnostics)
    }

    // go over opened documents and update any previous changes
    vscode.workspace.textDocuments.forEach((document) => {
      this.updatePositions(document)
    })
  }

  private updatePositions(document: vscode.TextDocument) {
    const baseUri = this._repositoryManager.rootUri?.path
    const issues =
      this._pr?.issues.filter((issue) => `${baseUri}/${issue.commitIssue.filePath}` === document.uri.fsPath) || []

    const documentLines = document.getText().split('\n')

    this._collection.delete(document.uri)
    const newDiagnostics: IssueDiagnostic[] = []

    issues.forEach((issue) => {
      if (documentLines[issue.commitIssue.lineNumber - 1].trim() === issue.commitIssue.lineText.trim()) {
        // nothing changed
        newDiagnostics.push(new IssueDiagnostic(issue))
      } else {
        const foundInLine = documentLines.findIndex((line) => line.trim() === issue.commitIssue.lineText.trim())

        // add the issue updating the line
        if (foundInLine >= 0) {
          newDiagnostics.push(
            new IssueDiagnostic({ ...issue, commitIssue: { ...issue.commitIssue, lineNumber: foundInLine + 1 } })
          )
        }
      }
    })

    this._collection.set(document.uri, newDiagnostics)
  }

  public clear() {
    this._collection.clear()
  }

  public dispose() {}
}

/**
 * Custom Code Action Provider to provide quick fixes for Codacy issues
 */
export class IssueActionProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext
  ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
    const diagnostics = context.diagnostics.filter(
      (diagnostic) => diagnostic.source?.startsWith('Codacy') && diagnostic.range.contains(range)
    ) as IssueDiagnostic[]

    return diagnostics
      .filter((d) => !!d.issue.commitIssue.suggestion)
      .map((d) => {
        const action = new vscode.CodeAction('Apply Codacy suggested fix', vscode.CodeActionKind.QuickFix)
        action.edit = new vscode.WorkspaceEdit()
        action.edit.replace(document.uri, d.range, d.issue.commitIssue.suggestion!.trim())
        action.diagnostics = [d]
        action.isPreferred = true
        return action
      })
  }
}
