import * as vscode from 'vscode'
import { groupBy, startCase } from 'lodash'
import { RepositoryManager } from '../git/RepositoryManager'
import { PullRequest, PullRequestIssue } from '../git/PullRequest'

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
  }

  public load(issues: PullRequestIssue[]) {
    // clear previous diagnostics
    this._collection.clear()

    // group issues by file using lodash
    const issuesByFile = groupBy(issues, (issue) => issue.commitIssue.filePath)
    const baseUri = this._repositoryManager.rootUri?.path

    // create diagnostics for each file
    for (const [filePath, issues] of Object.entries(issuesByFile)) {
      const diagnostics = issues.map((issue) => {
        const line = issue.commitIssue.lineNumber - 1
        const column = 0
        const message = `[${startCase(issue.commitIssue.patternInfo.category)}${
          issue.commitIssue.patternInfo.subCategory ? ` - ${startCase(issue.commitIssue.patternInfo.subCategory)}` : ''
        }] ${issue.commitIssue.message}`
        const severity = patternSeverityToDiagnosticSeverity(issue.commitIssue.patternInfo.severityLevel)

        const range = new vscode.Range(line, column, line, column + 300)

        const diagnostic = new vscode.Diagnostic(range, message, severity)
        diagnostic.source = `Codacy [${issue.commitIssue.toolInfo.name.replace('Codacy ', '')}]`
        diagnostic.code = issue.uri
          ? {
              value: issue.commitIssue.patternInfo.id,
              target: issue.uri,
            }
          : undefined

        return diagnostic
      })

      this._collection.set(vscode.Uri.file(`${baseUri}/${filePath}`), diagnostics)
    }
  }

  public clear() {
    this._collection.clear()
  }

  public dispose() {}
}
