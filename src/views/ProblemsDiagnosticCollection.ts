import * as vscode from 'vscode'
import { groupBy, startCase } from 'lodash'
import { RepositoryManager } from '../git/RepositoryManager'
import { PullRequestIssue } from '../git/PullRequest'
import { GitProvider } from '../git/GitProvider'
import { BranchIssue } from '../git/IssuesManager'
import { CommitIssue } from '../api/client'
import { runCodacyAnalyze } from '../commands/runCodacyAnalyze'
import Logger from '../common/logger'

interface CLIOutputIssue {
  level: string
  message: {
    text: string
  }
  locations: [
    {
      physicalLocation: {
        artifactLocation?: any
        region: {
          startLine: number
          startColumn: number
          endLine?: number
          endColumn?: number
        }
      }
    },
  ]
  descriptor?: {
    id: string
  }
  ruleId?: string
}

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
  constructor(
    readonly commitIssue: CommitIssue,
    readonly uri?: vscode.Uri
  ) {
    const line = commitIssue.lineNumber - 1

    // initial column = amount of blank spaces at the beginning of the line
    const startCol = commitIssue.lineText.match(/^(\s*)/)?.[1].length || 0
    const endCol = startCol + commitIssue.lineText.trim().length

    const message = `[${startCase(commitIssue.patternInfo.category)}${
      commitIssue.patternInfo.subCategory ? ` - ${startCase(commitIssue.patternInfo.subCategory)}` : ''
    }] ${commitIssue.message}`
    const severity = patternSeverityToDiagnosticSeverity(commitIssue.patternInfo.severityLevel)

    const range = new vscode.Range(line, startCol, line, endCol)

    super(range, message, severity)

    this.source = `Codacy [${commitIssue.toolInfo.name.replace('Codacy ', '')}]`
    this.code = uri
      ? {
          value: commitIssue.patternInfo.id,
          target: uri,
        }
      : undefined
  }
}

export class ProblemsDiagnosticCollection implements vscode.Disposable {
  private _collection: vscode.DiagnosticCollection = vscode.languages.createDiagnosticCollection('codacy')
  private _currentIssues: PullRequestIssue[] | BranchIssue[] = []
  private _isAnalysisRunning: boolean = false
  private _analysisDebounceTimeout: NodeJS.Timeout | undefined

  constructor(private readonly _repositoryManager: RepositoryManager) {
    _repositoryManager.onDidUpdatePullRequest((pr) => {
      const newIssues = pr?.issues.filter((issue) => issue.deltaType === 'Added') || []
      if (newIssues.length > 0) {
        this.load(newIssues)
      } else {
        this.clear()
      }
    })

    _repositoryManager.branchIssues.onDidUpdateBranchIssues((issues) => {
      if (issues.length > 0) {
        this.load(issues)
      } else {
        this.clear()
      }
    })

    GitProvider.instance?.onDidChangeTextDocument(async (e) => {
      this.updatePositions(e.document)
      await this.runAnalysisAndUpdateDiagnostics(e.document)
    })
  }

  private async runAnalysisAndUpdateDiagnostics(document: vscode.TextDocument) {
    // Clear any pending analysis
    if (this._analysisDebounceTimeout) {
      clearTimeout(this._analysisDebounceTimeout)
    }

    // Debounce the analysis for 2 seconds
    this._analysisDebounceTimeout = setTimeout(async () => {
      // Skip if analysis is already running
      if (this._isAnalysisRunning) {
        return
      }

      try {
        this._isAnalysisRunning = true
        // Run the analysis using the existing function
        const stdout = await runCodacyAnalyze(document.uri.fsPath)

        const jsonMatch = /(\{[\s\S]*\}|\[[\s\S]*\])/.exec(stdout)
        const sarifResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null

        const diagnostics: vscode.Diagnostic[] = []

        const issues: CLIOutputIssue[] | undefined =
          sarifResult.runs[0].results || sarifResult.runs[0].invocations[0].toolConfigurationNotifications
        const tool: string = sarifResult.runs[0].tool.driver.name

        Logger.warn('issues', JSON.stringify(issues, null, 2))
        issues?.map((issue) => {
          if (issue.locations && issue.locations[0].physicalLocation) {
            const location = issue.locations[0].physicalLocation
            const startLine = location.region.startLine - 1
            const startColumn = location.region.startColumn - 1 || 0
            const endLine = location.region.endLine ? location.region.endLine - 1 : startLine
            const endColumn = location.region.endColumn ? location.region.endColumn - 1 : startColumn + 1

            const message = issue.message.text

            const severity =
              issue.level === 'error'
                ? vscode.DiagnosticSeverity.Error
                : issue.level === 'warning'
                ? vscode.DiagnosticSeverity.Warning
                : vscode.DiagnosticSeverity.Information

            const range = new vscode.Range(startLine, startColumn, endLine, endColumn)

            const diagnostic = new vscode.Diagnostic(range, message, severity)

            diagnostic.source = `Codacy CLI [${tool.replace('Codacy ', '')}]`
            diagnostic.code = issue.ruleId || issue.descriptor.id

            diagnostics.push(diagnostic)
          }
        })

        // Update diagnostics for this file
        this._collection.set(document.uri, diagnostics)
      } catch (error) {
        console.error('Failed to process Codacy analysis:', error)
      } finally {
        this._isAnalysisRunning = false
      }
    }, 2000)
  }

  public load(issues: PullRequestIssue[] | BranchIssue[]) {
    // clear previous diagnostics
    this._collection.clear()
    this._currentIssues = []

    // group issues by file using lodash
    const issuesByFile = groupBy(issues, (issue) => issue.commitIssue.filePath)
    const baseUri = this._repositoryManager.rootUri?.path

    // create diagnostics for each file
    for (const [filePath, issues] of Object.entries(issuesByFile)) {
      const diagnostics = issues.map(({ commitIssue, uri }) => new IssueDiagnostic(commitIssue, uri))
      this._collection.set(vscode.Uri.file(`${baseUri}/${filePath}`), diagnostics)
    }

    this._currentIssues = [...issues]

    // go over opened documents and update any previous changes
    vscode.workspace.textDocuments.forEach((document) => {
      this.updatePositions(document)
    })
  }

  private updatePositions(document: vscode.TextDocument) {
    const baseUri = this._repositoryManager.rootUri?.path

    const documentIssues =
      this._currentIssues.filter((issue) => `${baseUri}/${issue.commitIssue.filePath}` === document.uri.fsPath) || []

    const documentLines = document.getText().split('\n')

    this._collection.delete(document.uri)
    const newDiagnostics: IssueDiagnostic[] = []

    documentIssues.forEach(({ commitIssue, uri }) => {
      if (documentLines[commitIssue.lineNumber - 1].trim() === commitIssue.lineText.trim()) {
        // nothing changed
        newDiagnostics.push(new IssueDiagnostic(commitIssue, uri))
      } else {
        const foundInLine = documentLines.findIndex((line) => line.trim() === commitIssue.lineText.trim())

        // add the issue updating the line
        if (foundInLine >= 0) {
          newDiagnostics.push(new IssueDiagnostic({ ...commitIssue, lineNumber: foundInLine + 1 }, uri))
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

    return diagnostics.flatMap((diagnostic) => {
      const actions: vscode.CodeAction[] = []

      // add fix for the issue if suggestion is present
      if (diagnostic.commitIssue.suggestion) {
        const action = new vscode.CodeAction('Apply Codacy suggested fix', vscode.CodeActionKind.QuickFix)
        action.edit = new vscode.WorkspaceEdit()
        action.edit.replace(document.uri, diagnostic.range, diagnostic.commitIssue.suggestion.trim())
        action.diagnostics = [diagnostic]
        action.isPreferred = true
        actions.push(action)
      }

      // add see issue details actions
      const seeIssueDetailsAction = new vscode.CodeAction('See issue details', vscode.CodeActionKind.QuickFix)
      seeIssueDetailsAction.diagnostics = [diagnostic]
      seeIssueDetailsAction.command = {
        command: 'codacy.issue.seeDetails',
        title: 'See issue details',
        arguments: [diagnostic.commitIssue],
      }
      actions.push(seeIssueDetailsAction)

      return actions
    })
  }
}
