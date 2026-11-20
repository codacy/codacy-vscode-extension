import * as vscode from 'vscode'
import * as fs from 'fs'
import { groupBy, startCase, uniqBy } from 'lodash'
import { CodacyCloud } from '../git/CodacyCloud'
import { PullRequestIssue } from '../git/PullRequest'
import { GitProvider } from '../git/GitProvider'
import { BranchIssue } from '../git/IssuesManager'
import { CommitIssue, Provider, SeverityLevel } from '../api/client'
import { ProcessedSarifResult } from '../cli'
import * as path from 'path'
import Logger from '../common/logger'
import { CodacyError, handleError } from '../common/utils'
import { StatusBar } from './StatusBar'
import { CodacyCli, onInitialized, onToolsInstalled } from '../cli/CodacyCli'
import { AnalysisRequestOptions, AnalysisScheduler } from './AnalysisScheduler'

/** Wait after the last edit before analyzing, so typing doesn't queue a run per keystroke. */
const EDIT_DEBOUNCE_MS = 2000
/** Wait after a save or an editor switch, so cycling through tabs settles first. */
const FOCUS_DEBOUNCE_MS = 500

const patternSeverityToDiagnosticSeverity = (severity: SeverityLevel): vscode.DiagnosticSeverity => {
  switch (severity) {
    case 'Info':
      return vscode.DiagnosticSeverity.Information
    case 'Warning':
      return vscode.DiagnosticSeverity.Warning
    case 'High':
      return vscode.DiagnosticSeverity.Warning
    case 'Error':
      return vscode.DiagnosticSeverity.Error
    default:
      return vscode.DiagnosticSeverity.Error
  }
}

export class ApiIssueDiagnostic extends vscode.Diagnostic {
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

export class CliIssueDiagnostic extends vscode.Diagnostic {
  constructor(readonly result: ProcessedSarifResult) {
    const severity =
      result.level === 'error'
        ? vscode.DiagnosticSeverity.Error
        : result.level === 'warning'
          ? vscode.DiagnosticSeverity.Warning
          : vscode.DiagnosticSeverity.Information

    const range = new vscode.Range(
      (result.region?.startLine || 1) - 1,
      (result.region?.startColumn || 1) - 1,
      (result.region?.endLine || result.region?.startLine || 1) - 1,
      (result.region?.endColumn || 100) - 1
    )

    super(range, result.message, severity)

    this.source = `Codacy CLI [${result.tool}]`
    this.code = result.rule?.helpUri
      ? {
          value: result.rule.id,
          target: vscode.Uri.parse(result.rule.helpUri),
        }
      : result.rule?.id
  }
}

export class ProblemsDiagnosticCollection implements vscode.Disposable {
  private readonly _collection: vscode.DiagnosticCollection = vscode.languages.createDiagnosticCollection('codacy')

  private _currentApiIssues: { [key in string]: PullRequestIssue[] | BranchIssue[] } = {}
  private _currentCliIssues: { [key in string]: ProcessedSarifResult[] } = {}

  /** Runs local analyses one at a time, keeping the latest request per file. */
  private readonly _scheduler = new AnalysisScheduler<vscode.TextDocument>((document, signal) =>
    this.analyzeDocument(document, signal)
  )

  private readonly _subscriptions: vscode.Disposable[] = []

  constructor(
    private readonly _codacyCloud: CodacyCloud,
    private readonly _statusBar?: StatusBar
  ) {
    // load all API issues when the pull request is updated
    _codacyCloud.onDidUpdatePullRequest((pr) => {
      const newIssues = pr?.issues.filter((issue) => issue.deltaType === 'Added') || []
      this.loadAPIIssues(newIssues)
    })

    // load all API issues when the branch is updated
    _codacyCloud.branchIssues.onDidUpdateBranchIssues((issues) => {
      this.loadAPIIssues(issues)
    })

    // Opening a file only positions its remote issues. It is analyzed when it
    // becomes the active editor, not for every file VS Code opens in the background.
    const onDidOpenTextDocument = GitProvider.instance?.onDidOpenTextDocument((document) => {
      this.updateApiIssuesPositions(document)
    })
    if (onDidOpenTextDocument) this._subscriptions.push(onDidOpenTextDocument)

    const onDidChangeTextDocument = GitProvider.instance?.onDidChangeTextDocument((e) => {
      // Events without content changes only flip the dirty flag.
      if (e.contentChanges.length === 0) return
      // update positions of remote issues in the document
      this.updateApiIssuesPositions(e.document)
      this.requestAnalysis(e.document, { delayMs: EDIT_DEBOUNCE_MS })
    })
    if (onDidChangeTextDocument) this._subscriptions.push(onDidChangeTextDocument)

    this._subscriptions.push(
      vscode.workspace.onDidSaveTextDocument((document) =>
        this.requestAnalysis(document, { delayMs: FOCUS_DEBOUNCE_MS })
      ),
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) this.requestAnalysis(editor.document, { delayMs: FOCUS_DEBOUNCE_MS, focus: true })
      }),
      vscode.workspace.onDidCloseTextDocument((document) => this._scheduler.forget(document.uri.fsPath))
    )
    const activeDocument = vscode.window.activeTextEditor?.document
    if (activeDocument) this.requestAnalysis(activeDocument, { delayMs: FOCUS_DEBOUNCE_MS, focus: true })

    // Setup or a config refresh completed, or a background install made a tool
    // available: earlier results are out of date (or there were none), so analyze
    // the active file again without waiting for the next change.
    this._subscriptions.push(
      onInitialized(() => this.reanalyzeActiveFile()),
      onToolsInstalled(() => this.reanalyzeActiveFile())
    )

    // Listen for file deletions and clear diagnostics for deleted files
    this._subscriptions.push(
      vscode.workspace.onDidDeleteFiles((event) => {
        for (const file of event.files) {
          this.removeDiagnosticsForFile(file)
        }
      })
    )

    // Listen for file renames and clear diagnostics for renamed files
    this._subscriptions.push(
      vscode.workspace.onDidRenameFiles((event) => {
        for (const file of event.files) {
          this.renameDiagnosticsForFile(file.oldUri, file.newUri)
        }
      })
    )
  }

  private updateDiagnostics() {
    this._collection.clear()
    const filesWithApiIssues = Object.keys(this._currentApiIssues).map((key) => ({ file: key, isCliIssue: false }))
    const filesWithCliIssues = Object.keys(this._currentCliIssues).map((key) => ({ file: key, isCliIssue: true }))
    const allFiles = uniqBy([...filesWithApiIssues, ...filesWithCliIssues], 'file')
    allFiles.forEach(({ file, isCliIssue }) => {
      const document = vscode.workspace.textDocuments.find((doc) => doc.uri.fsPath === file)
      if (document) {
        isCliIssue ? this.updateDocumentDiagnostics(document) : this.updateApiIssuesPositions(document)
      }
    })
  }

  private updateDocumentDiagnostics(document: vscode.TextDocument) {
    this._collection.delete(document.uri)

    // get API issues for the current document
    const documentApiIssues = this._currentApiIssues[document.uri.fsPath] || []
    const documentCliIssues = this._currentCliIssues[document.uri.fsPath] || []

    // remove API issues found in the CLI issues
    const filteredApiIssues = documentCliIssues.length
      ? documentApiIssues.filter(
          (apiIssue) =>
            !documentCliIssues.some(
              (cliIssue) =>
                cliIssue.message === apiIssue.commitIssue.message &&
                cliIssue.region?.startLine === apiIssue.commitIssue.lineNumber
            )
        )
      : documentApiIssues

    const apiDiagnostics = filteredApiIssues.map(({ commitIssue, uri }) => new ApiIssueDiagnostic(commitIssue, uri))
    const cliDiagnostics = documentCliIssues.map((result) => new CliIssueDiagnostic(result))

    this._collection.set(document.uri, [...apiDiagnostics, ...cliDiagnostics])
  }

  private async retryDeleteFile(filePath: string, maxAttempts: number = 3, delayMs: number = 1000): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await vscode.workspace.fs.delete(vscode.Uri.file(filePath))
        return true
      } catch (err) {
        if (attempt === maxAttempts) {
          Logger.error(`Failed to delete temporary file after ${maxAttempts} attempts:`, (err as Error).message)
          return false
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
    return false
  }

  /** Forgets which versions were analyzed and analyzes the active file again. */
  private reanalyzeActiveFile() {
    this._scheduler.resetAnalyzedVersions()
    const document = vscode.window.activeTextEditor?.document
    if (document) this.requestAnalysis(document, { delayMs: 0, force: true })
  }

  /** Queues a local analysis of the document, if local analysis applies to it. */
  private requestAnalysis(document: vscode.TextDocument, options: AnalysisRequestOptions) {
    if (document.uri.scheme !== 'file') return

    const fsPath = document.uri.fsPath
    // Git internals and files written by the old shell-based CLI
    if (fsPath.endsWith('.git') || fsPath.endsWith('codacy-cli.log') || fsPath.endsWith('cli.sh')) return

    if (!this.isAnalysisModeAllowing(document)) return

    this._scheduler.request(document, options)
  }

  /** Whether the `codacy.cli.analysisMode` setting allows analyzing the document as it is now. */
  private isAnalysisModeAllowing(document: vscode.TextDocument): boolean {
    const analysisMode = vscode.workspace.getConfiguration().get('codacy.cli.analysisMode')
    return analysisMode !== 'disabled' && !(analysisMode === 'only on saved files' && document.isDirty)
  }

  /** Whether local analysis is set up and applies to the document, checked when its run starts. */
  private canAnalyzeNow(document: vscode.TextDocument): boolean {
    // The setting, or the dirty state in saved-only mode, may have changed since the request.
    if (!this.isAnalysisModeAllowing(document)) return false

    // Check for the presence of the .codacy/codacy.config.json file to know if the CLI is initialized
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ''
    const codacyCLIConfigPath = path.join(workspacePath, '.codacy', 'codacy.config.json')
    const cli = this._codacyCloud.cli
    if (!cli?.isInitialized() || !fs.existsSync(codacyCLIConfigPath)) return false

    // Files Codacy writes itself (config, generated tool configs) are not analyzed,
    // and the file may have been deleted since the request.
    return !cli.isInCodacyFolder(document.uri.fsPath) && fs.existsSync(document.uri.fsPath)
  }

  /**
   * Analyzes one document and shows its findings. Called by the scheduler, one at a
   * time.
   *
   * @returns whether the analysis completed (it may be skipped or cancelled)
   */
  private async analyzeDocument(document: vscode.TextDocument, signal: AbortSignal): Promise<boolean> {
    const cli = this._codacyCloud.cli
    if (!cli || !this.canAnalyzeNow(document)) return false

    const originalPath = document.uri.fsPath
    let pathToFile = originalPath

    try {
      // Show scanning status in status bar
      this._statusBar?.setCliScanning(true)

      // check if document is saved or not
      if (document.isDirty) {
        // Analyze the unsaved content from a temporary file next to the document
        // (the runner only reads files inside the repository).
        const filePath = path.dirname(document.fileName)
        pathToFile = path.join(filePath, `${Date.now().valueOf().toString()}-${path.basename(document.fileName)}`)
        await vscode.workspace.fs.writeFile(vscode.Uri.file(pathToFile), new TextEncoder().encode(document.getText()))
      }

      // Run the local analysis (the runner takes the plain path — no shell quoting)
      const results = await cli.analyze({ file: pathToFile, signal })

      // Cancelled: a newer request for this file replaces it.
      if (results === null || signal.aborted) return false

      this._currentCliIssues[originalPath] = results
      this.updateDocumentDiagnostics(document)
      return true
    } catch (error) {
      // If the file no longer exists, silently ignore the error
      if (!fs.existsSync(pathToFile)) return false
      if (error instanceof CodacyError) handleError(error, false)
      else {
        handleError(new CodacyError('Error running analysis', error as Error, 'CLI'))
      }
      return false
    } finally {
      if (pathToFile !== originalPath) {
        // Remove the temporary file after analysis with retries. Not awaited: a locked
        // file would otherwise hold the next queued analysis for the retry delays.
        const tempFile = pathToFile
        void this.retryDeleteFile(tempFile).then((deleted) => {
          if (!deleted) Logger.error('Failed to delete temporary file after all attempts:', tempFile)
        })
      }

      // Hide scanning status in status bar
      this._statusBar?.setCliScanning(false)
    }
  }

  private renameDiagnosticsForFile(oldUri: vscode.Uri, newUri: vscode.Uri) {
    this._collection.delete(oldUri)

    this._currentApiIssues[newUri.fsPath] = this._currentApiIssues[oldUri.fsPath]
    delete this._currentApiIssues[oldUri.fsPath]
    this._currentCliIssues[newUri.fsPath] = this._currentCliIssues[oldUri.fsPath]
    delete this._currentCliIssues[oldUri.fsPath]

    const document = vscode.workspace.textDocuments.find((doc) => doc.uri.fsPath === newUri.fsPath)
    if (document) {
      this.updateDocumentDiagnostics(document)
    }
  }

  public loadAPIIssues(issues: PullRequestIssue[] | BranchIssue[]) {
    const baseUri = this._codacyCloud.rootUri?.path
    const issuesByFile = groupBy(issues, (issue) => issue.commitIssue.filePath)

    this._currentApiIssues = Object.fromEntries(
      Object.entries(issuesByFile).map(([filePath, issues]) => [`${baseUri}/${filePath}`, issues])
    )
    this.updateDiagnostics()
  }

  private updateApiIssuesPositions(document: vscode.TextDocument) {
    const documentIssues = this._currentApiIssues[document.uri.fsPath] || []

    const documentLines = document.getText().split('\n')
    const validIssues: (PullRequestIssue | BranchIssue)[] = []

    documentIssues.forEach((issue) => {
      const { commitIssue } = issue

      if (documentLines[commitIssue.lineNumber - 1]?.trim() !== commitIssue.lineText.trim()) {
        const foundInLine = documentLines.findIndex((line) => line.trim() === commitIssue.lineText.trim())
        if (foundInLine >= 0) {
          commitIssue.lineNumber = foundInLine + 1
          validIssues.push(issue)
        } else {
          Logger.appendLine(
            `Removing diagnostic for issue no longer found in document: "${commitIssue.lineText.trim()}" in ${document.uri.fsPath}`
          )
          // Issue is no longer found in the document, so we don't add it to validIssues
        }
      } else {
        validIssues.push(issue)
      }
    })

    // Update the current API issues to only include valid issues
    this._currentApiIssues[document.uri.fsPath] = validIssues

    this.updateDocumentDiagnostics(document)
  }

  public clear() {
    this._collection.clear()
  }

  public dispose() {
    this._scheduler.dispose()
    this._subscriptions.forEach((subscription) => subscription.dispose())
    this.clear()
  }

  public removeDiagnosticsForFile(uri: vscode.Uri) {
    this._collection.delete(uri)
    delete this._currentApiIssues[uri.fsPath]
    delete this._currentCliIssues[uri.fsPath]
  }
}

/**
 * Custom Code Action Provider to provide quick fixes for Codacy issues
 */
export class IssueActionProvider implements vscode.CodeActionProvider {
  constructor(
    private getParams?: () => { provider: Provider; organization: string; repository: string } | undefined,
    private cli?: CodacyCli
  ) {}

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext
  ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
    const diagnostics = context.diagnostics.filter(
      (diagnostic) => diagnostic.source?.startsWith('Codacy') && diagnostic.range.contains(range)
    ) as (ApiIssueDiagnostic | CliIssueDiagnostic)[]

    return diagnostics.flatMap((diagnostic) => {
      const actions: vscode.CodeAction[] = []

      // Handle API diagnostics
      if (diagnostic instanceof ApiIssueDiagnostic) {
        // add fix for the issue if suggestion is present
        if (diagnostic.commitIssue.suggestion) {
          const action = new vscode.CodeAction(
            `Codacy: Apply Codacy suggested fix (${diagnostic.commitIssue.patternInfo.id})`,
            vscode.CodeActionKind.QuickFix
          )
          action.edit = new vscode.WorkspaceEdit()
          action.edit.replace(document.uri, diagnostic.range, diagnostic.commitIssue.suggestion.trim())
          action.diagnostics = [diagnostic]
          action.isPreferred = true
          actions.push(action)
        }

        // add see issue details actions for API issues
        const seeIssueDetailsAction = new vscode.CodeAction(
          `Codacy: See issue details (${diagnostic.commitIssue.patternInfo.id})`,
          vscode.CodeActionKind.QuickFix
        )
        seeIssueDetailsAction.diagnostics = [diagnostic]
        seeIssueDetailsAction.command = {
          command: 'codacy.issue.seeDetails',
          title: 'Codacy: See issue details',
          arguments: [diagnostic.commitIssue],
        }
        actions.push(seeIssueDetailsAction)

        // add disable pattern action for API issues
        const params = this.getParams?.()
        if (params) {
          const disablePatternAction = new vscode.CodeAction(
            `Codacy: Disable pattern (${diagnostic.commitIssue.patternInfo.id})`,
            vscode.CodeActionKind.QuickFix
          )
          disablePatternAction.diagnostics = [diagnostic]
          disablePatternAction.command = {
            command: 'codacy.issue.disablePattern',
            title: 'Codacy: Disable pattern',
            arguments: [diagnostic.commitIssue, params, this.cli],
          }
          actions.push(disablePatternAction)
        }
      }

      // Handle CLI diagnostics
      else if (diagnostic instanceof CliIssueDiagnostic) {
        // add see issue details actions for CLI issues
        const seeIssueDetailsAction = new vscode.CodeAction(
          `Codacy CLI: See issue details (${diagnostic.result.rule?.id})`,
          vscode.CodeActionKind.QuickFix
        )
        seeIssueDetailsAction.diagnostics = [diagnostic]
        seeIssueDetailsAction.command = {
          command: 'codacy.cliIssue.seeDetails',
          title: 'Codacy CLI: See issue details',
          arguments: [diagnostic.result],
        }
        actions.push(seeIssueDetailsAction)

        // add disable pattern action for CLI issues
        const params = this.getParams?.()
        if (params) {
          const disablePatternAction = new vscode.CodeAction(
            `Codacy CLI: Disable pattern (${diagnostic.result.rule?.id})`,
            vscode.CodeActionKind.QuickFix
          )
          disablePatternAction.diagnostics = [diagnostic]
          disablePatternAction.command = {
            command: 'codacy.cliIssue.disablePattern',
            title: 'Codacy CLI: Disable pattern',
            arguments: [params, diagnostic.result, this.cli],
          }
          actions.push(disablePatternAction)
        }
      }

      return actions
    })
  }
}
