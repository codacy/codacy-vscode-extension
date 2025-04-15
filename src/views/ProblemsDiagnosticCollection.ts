import * as vscode from 'vscode'
import { groupBy, startCase } from 'lodash'
import { RepositoryManager } from '../git/RepositoryManager'
import { PullRequestIssue } from '../git/PullRequest'
import { GitProvider } from '../git/GitProvider'
import { BranchIssue } from '../git/IssuesManager'
import { CommitIssue } from '../api/client'
import { ProcessedSarifResult, runCodacyAnalyze } from '../commands/runCodacyAnalyze'
import * as path from 'path'
// import * as os from 'os'

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
  private _collection: vscode.DiagnosticCollection = vscode.languages.createDiagnosticCollection('codacy')

  private _currentApiIssues: { [key in string]: PullRequestIssue[] | BranchIssue[] } = {}
  private _currentCliIssues: { [key in string]: ProcessedSarifResult[] } = {}

  private _isAnalysisRunning: boolean = false
  private _analysisDebounceTimeout: NodeJS.Timeout | undefined

  constructor(private readonly _repositoryManager: RepositoryManager) {
    // load all API issues when the pull request is updated
    _repositoryManager.onDidUpdatePullRequest((pr) => {
      const newIssues = pr?.issues.filter((issue) => issue.deltaType === 'Added') || []
      this.loadAPIIssues(newIssues)
    })

    // load all API issues when the branch is updated
    _repositoryManager.branchIssues.onDidUpdateBranchIssues((issues) => {
      this.loadAPIIssues(issues)
    })

    GitProvider.instance?.onDidChangeTextDocument(async (e) => {
      // avoid if the document is a .git file
      if (e.document.uri.fsPath.endsWith('.git')) return

      // update positions of remote issues in the document
      this.updateApiIssuesPositions(e.document)

      // run local analysis for available tools
      await this.runAnalysisAndUpdateDiagnostics(e.document)
    })
  }

  private updateDiagnostics() {
    this._collection.clear()
    const filesWithApiIssues = Object.keys(this._currentApiIssues)
    const filesWithCliIssues = Object.keys(this._currentCliIssues)
    const allFiles = [...new Set([...filesWithApiIssues, ...filesWithCliIssues])]
    allFiles.forEach((file) => {
      const document = vscode.workspace.textDocuments.find((doc) => doc.uri.fsPath === file)
      if (document) {
        this.updateDocumentDiagnostics(document)
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

    const allDiagnostics = [...apiDiagnostics, ...cliDiagnostics]
    this._collection.set(document.uri, allDiagnostics)

    // Open problems panel if there are any diagnostics
    if (allDiagnostics.length > 0) {
      vscode.commands.executeCommand('workbench.actions.view.problems')
    }
  }

  private async runAnalysisAndUpdateDiagnostics(document: vscode.TextDocument) {
    // TODO: check if Codacy CLI is available and initialized

    // Clear any pending analysis
    if (this._analysisDebounceTimeout) {
      clearTimeout(this._analysisDebounceTimeout)
    }

    // Debounce the analysis for 2 seconds
    this._analysisDebounceTimeout = setTimeout(async () => {
      // Skip if analysis is already running
      if (this._isAnalysisRunning) return

      // Check for the presence of the .codacy/codacy.yaml file to know if the CLI is initialized
      const codacyConfigPath = path.join(this._repositoryManager.rootUri?.fsPath || '', '.codacy', 'codacy.yaml')
      const codacyConfigExists =
        (await vscode.workspace.fs.stat(vscode.Uri.file(codacyConfigPath)).then(() => true)) || false

      if (!codacyConfigExists) return

      let pathToFile = document.uri.fsPath

      try {
        this._isAnalysisRunning = true

        // check if document is saved or not
        if (document.isDirty) {
          // use a temporary file instead for analysis
          const fileName = path.basename(document.fileName)

          // system temp directory -- doesn't work, TODO: check if the CLI can receive a base path
          //const tmpDir = path.join(os.tmpdir(), 'codacy-vscode')

          // or ... .codacy/tmp directory -- doesn't work
          // const tmpDir = path.join(this._repositoryManager.rootUri?.path || '', '.codacy', 'tmp')

          // create the temp directory if it doesn't exist
          // await vscode.workspace.fs.createDirectory(vscode.Uri.file(tmpDir))

          // same directory as the document
          const filePath = path.dirname(document.fileName)
          pathToFile = path.join(filePath, `${Date.now().valueOf().toString()}-${fileName}`)

          // Convert string content to Uint8Array
          const content = new TextEncoder().encode(document.getText())
          await vscode.workspace.fs.writeFile(vscode.Uri.file(pathToFile), content)
        }

        // Run the local analysis
        const results = await runCodacyAnalyze(pathToFile)

        this._currentCliIssues[document.uri.fsPath] = results

        this.updateDocumentDiagnostics(document)
      } catch (error) {
        console.error('Failed to process Codacy analysis:', error)
      } finally {
        this._isAnalysisRunning = false

        if (document.isDirty) {
          // Remove the temporary file after analysis
          try {
            await vscode.workspace.fs.delete(vscode.Uri.file(pathToFile))
          } catch (err) {
            console.error('Failed to delete temporary file:', err)
          }
        }
      }
    }, 2000)
  }

  public loadAPIIssues(issues: PullRequestIssue[] | BranchIssue[]) {
    const baseUri = this._repositoryManager.rootUri?.path
    const issuesByFile = groupBy(issues, (issue) => issue.commitIssue.filePath)

    this._currentApiIssues = Object.fromEntries(
      Object.entries(issuesByFile).map(([filePath, issues]) => [`${baseUri}/${filePath}`, issues])
    )
    this.updateDiagnostics()
  }

  private updateApiIssuesPositions(document: vscode.TextDocument) {
    const documentIssues = this._currentApiIssues[document.uri.fsPath] || []

    const documentLines = document.getText().split('\n')

    documentIssues.forEach(({ commitIssue }) => {
      if (documentLines[commitIssue.lineNumber - 1].trim() !== commitIssue.lineText.trim()) {
        const foundInLine = documentLines.findIndex((line) => line.trim() === commitIssue.lineText.trim())

        if (foundInLine >= 0) {
          commitIssue.lineNumber = foundInLine + 1
        }
      }
    })

    this.updateDocumentDiagnostics(document)
  }

  public clear() {
    this._collection.clear()
  }

  public dispose() {
    this.clear()
  }
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
    ) as ApiIssueDiagnostic[]

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
