import * as vscode from 'vscode'
import { CodacyCloud, CodacyCloudState } from './CodacyCloud'
import Logger from '../common/logger'
import { CommitIssue } from '../api/client'
import { Api } from '../api'

export const MAX_FETCH_BRANCH_ISSUES = 300

export interface BranchIssue {
  commitIssue: CommitIssue
  uri?: vscode.Uri
}

export class IssuesManager implements vscode.Disposable {
  private _disposables: vscode.Disposable[] = []
  private _allIssues: BranchIssue[] = []

  private _onDidUpdateBranchIssues = new vscode.EventEmitter<BranchIssue[]>()
  readonly onDidUpdateBranchIssues: vscode.Event<BranchIssue[]> = this._onDidUpdateBranchIssues.event

  constructor(private readonly _codacyCloud: CodacyCloud) {}

  public async refresh() {
    if (this._codacyCloud.state !== CodacyCloudState.Loaded || !this._codacyCloud.repository) return

    const currentBranch = this._codacyCloud.head?.name

    if (!currentBranch || !this._codacyCloud.enabledBranches.some((b) => b.name === currentBranch)) {
      Logger.warn(`No analysed branch found: ${currentBranch || 'no HEAD information'}`)
      return
    }

    const repo = this._codacyCloud.repository

    const load = async () => {
      this._allIssues = []
      let nextCursor: string | undefined

      try {
        do {
          const { data: issues, pagination } = await Api.Analysis.searchRepositoryIssues(
            repo.provider,
            repo.owner,
            repo.name,
            {
              branchName: currentBranch,
            },
            nextCursor
          )

          this._allIssues.push(
            ...issues.map((issue) => ({
              commitIssue: issue,
              uri: vscode.Uri.parse(
                `https://app.codacy.com/${repo.provider}/${repo.owner}/${repo.name}/issues/${issue.resultDataId}`
              ),
            }))
          )
          nextCursor = pagination?.cursor
        } while (nextCursor && this._allIssues.length < MAX_FETCH_BRANCH_ISSUES)
      } catch (e) {
        Logger.appendLine(`Failed to load issues: ${e}`)
      } finally {
        this._onDidUpdateBranchIssues.fire(this._allIssues)
      }
    }

    vscode.window.withProgress({ location: { viewId: 'codacy:branchIssues' } }, load)
  }

  public clear() {
    this._allIssues = []
    this._onDidUpdateBranchIssues.fire(this._allIssues)
  }

  dispose() {
    this._disposables.forEach((disposable) => disposable.dispose())
  }
}
