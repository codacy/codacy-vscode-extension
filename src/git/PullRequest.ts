import * as vscode from 'vscode'
import { PullRequestWithAnalysis } from '../api/client'
import { RepositoryManager, RepositoryManagerState } from './RepositoryManager'
import { Api } from '../api'
import Logger from '../common/logger'

export class PullRequest {
  private _prWithAnalysis: PullRequestWithAnalysis

  private _onDidUpdatePullRequest = new vscode.EventEmitter<PullRequest>()
  readonly onDidUpdatePullRequest: vscode.Event<PullRequest> = this._onDidUpdatePullRequest.event

  constructor(
    prWithAnalysis: PullRequestWithAnalysis,
    private readonly repositoryManager: RepositoryManager
  ) {
    this._prWithAnalysis = prWithAnalysis
    Logger.appendLine(`Found pull request: ${JSON.stringify(this._prWithAnalysis)}`)
  }

  public async refresh() {
    if (
      this.repositoryManager.state !== RepositoryManagerState.Loaded ||
      this.repositoryManager.repository === undefined
    ) {
      return
    }

    const repo = this.repositoryManager.repository

    const fetch = async () => {
      const prAnalysis = await Api.Analysis.getRepositoryPullRequest(
        repo.provider,
        repo.owner,
        repo.name,
        this._prWithAnalysis.pullRequest.number
      )

      this._prWithAnalysis = prAnalysis
      this._onDidUpdatePullRequest.fire(this)

      Logger.appendLine(`Updated pull request: ${JSON.stringify(this._prWithAnalysis)}`)

      return prAnalysis
    }

    vscode.window.withProgress({ location: { viewId: 'codacy:statuses' } }, fetch)
  }

  get analysis() {
    return this._prWithAnalysis
  }

  get meta() {
    return this._prWithAnalysis.pullRequest
  }
}
