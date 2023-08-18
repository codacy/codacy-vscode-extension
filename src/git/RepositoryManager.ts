import * as vscode from 'vscode'
import { Repository as GitRepository } from './git'
import Logger from '../common/logger'
import { parseGitRemote } from '../common/parseGitRemote'
import { Api } from '../api'
import { CoreApiError, Repository } from '../api/client'
import { handleError } from '../common/utils'
import { PullRequest } from './PullRequest'

export enum RepositoryManagerState {
  NoRepository = 'NoRepository',
  NoRemote = 'NoRemote',
  Initializing = 'Initializing',
  NeedsAuthentication = 'NeedsAuthentication',
  Loaded = 'Loaded',
}

export enum PullRequestState {
  NoPullRequest = 'NoPullRequest',
  Loaded = 'Loaded',
}

const RM_STATE_CONTEXT_KEY = 'Codacy:RepositoryManagerStateContext'
const PR_STATE_CONTEXT_KEY = 'Codacy:PullRequestStateContext'

export class RepositoryManager implements vscode.Disposable {
  private _current: GitRepository | undefined
  private _repository: Repository | undefined
  private _pullRequest: PullRequest | undefined
  private _state: RepositoryManagerState = RepositoryManagerState.Initializing
  private _prState: PullRequestState = PullRequestState.NoPullRequest

  private _onDidChangeState = new vscode.EventEmitter<RepositoryManagerState>()
  readonly onDidChangeState: vscode.Event<RepositoryManagerState> = this._onDidChangeState.event

  private _onDidLoadRepository = new vscode.EventEmitter<Repository>()
  readonly onDidLoadRepository: vscode.Event<Repository> = this._onDidLoadRepository.event

  private _onDidUpdatePullRequest = new vscode.EventEmitter<PullRequest>()
  readonly onDidUpdatePullRequest: vscode.Event<PullRequest> = this._onDidUpdatePullRequest.event

  constructor() {
    vscode.commands.executeCommand('setContext', RM_STATE_CONTEXT_KEY, this._state)
    vscode.commands.executeCommand('setContext', PR_STATE_CONTEXT_KEY, this._prState)
  }

  public async open(repository: GitRepository) {
    const openRepository = async () => {
      this._current = repository

      try {
        if (repository.state.HEAD === undefined) {
          this.state = RepositoryManagerState.Initializing
        } else {
          if (!repository.state.remotes[0]?.pushUrl) {
            this.state = RepositoryManagerState.NoRemote
            Logger.error('No remote found')
            return
          }

          const repo = parseGitRemote(repository.state.remotes[0].pushUrl)
          const { data } = await Api.Repository.getRepository(repo.provider, repo.organization, repo.repository)

          this._repository = data
          this._onDidLoadRepository.fire(data)

          this.state = RepositoryManagerState.Loaded

          // trigger the pull request load
          this.loadPullRequest()
        }
      } catch (e) {
        handleError(e as Error)
        if (e instanceof CoreApiError) {
          this.state = RepositoryManagerState.NeedsAuthentication
        } else {
          this.state = RepositoryManagerState.NoRepository
        }
      }
    }

    vscode.window.withProgress({ location: { viewId: 'codacy:statuses' } }, openRepository)
  }

  public async loadPullRequest() {
    if (this._state !== RepositoryManagerState.Loaded || !this._repository) return

    const repo = this._repository
    const currentBranch = this._current?.state.HEAD?.name

    if (!currentBranch) {
      Logger.warn(`No HEAD information found: ${JSON.stringify(this._current?.state)}`)
      this.prState = PullRequestState.NoPullRequest
      return
    }

    const load = async () => {
      try {
        // look for the pull request in the repository
        const { data: prs } = await Api.Analysis.listRepositoryPullRequests(repo.provider, repo.owner, repo.name, 100)

        const pr = prs.find((pr) => pr.pullRequest.originBranch === currentBranch)

        if (!pr) {
          Logger.appendLine(`No PR found in Codacy for: ${currentBranch}`)
          this.prState = PullRequestState.NoPullRequest
          return
        }

        if (pr.pullRequest.number === this._pullRequest?.meta.number) {
          // PR is the same, refresh it
          this._pullRequest.refresh()
        } else {
          // PR is different, create a new one
          this._pullRequest = new PullRequest(pr, this)

          // trigger the pull request load
          this._onDidUpdatePullRequest.fire(this._pullRequest)

          // subscribe to future pull request updates
          this._pullRequest.onDidUpdatePullRequest((pr) => {
            this._onDidUpdatePullRequest.fire(pr)
          })
        }
        this.prState = PullRequestState.Loaded
      } catch (e) {
        handleError(e as Error)
      }
    }

    vscode.window.withProgress({ location: { viewId: 'codacy:statuses' } }, load)
  }

  public close(repository: GitRepository) {
    if (this._current === repository) {
      this.clear()
    }
  }

  public clear() {
    this._current = undefined
    this.state = RepositoryManagerState.NoRepository
  }

  get repository() {
    return this._repository
  }

  get pullRequest() {
    return this._pullRequest
  }

  get state() {
    return this._state
  }

  get branch() {
    return this._current?.state.HEAD?.name
  }

  get rootUri() {
    return this._current?.rootUri
  }

  set state(state: RepositoryManagerState) {
    const stateChange = state !== this._state
    this._state = state
    if (stateChange) {
      vscode.commands.executeCommand('setContext', RM_STATE_CONTEXT_KEY, state)
      this._onDidChangeState.fire(state)
    }
  }

  set prState(state: PullRequestState) {
    const stateChange = state !== this._prState
    this._prState = state
    if (stateChange) {
      vscode.commands.executeCommand('setContext', PR_STATE_CONTEXT_KEY, state)
    }
  }

  public dispose() {}
}
