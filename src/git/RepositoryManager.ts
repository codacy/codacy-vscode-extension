import * as vscode from 'vscode'
import { Repository as GitRepository } from './git'
import Logger from '../common/logger'
import { parseGitRemote } from '../common/parseGitRemote'
import { Api } from '../api'
import { CoreApiError, Repository } from '../api/client'
import { handleError } from '../common/utils'
import { PullRequest, PullRequestInfo } from './PullRequest'
import { Config } from '../common/config'

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

const LOAD_RETRY_TIME = 2 * 60 * 1000
const MAX_LOAD_ATTEMPTS = 5

export class RepositoryManager implements vscode.Disposable {
  private _current: GitRepository | undefined
  private _repository: Repository | undefined
  private _expectCoverage: boolean | undefined
  private _state: RepositoryManagerState = RepositoryManagerState.Initializing

  private _branch: string | undefined
  private _pullRequest: PullRequest | undefined
  private _pullRequests: PullRequestInfo[] = []
  private _prState: PullRequestState = PullRequestState.NoPullRequest

  private _onDidChangeState = new vscode.EventEmitter<RepositoryManagerState>()
  readonly onDidChangeState: vscode.Event<RepositoryManagerState> = this._onDidChangeState.event

  private _onDidLoadRepository = new vscode.EventEmitter<Repository>()
  readonly onDidLoadRepository: vscode.Event<Repository> = this._onDidLoadRepository.event

  private _onDidUpdatePullRequest = new vscode.EventEmitter<PullRequest | undefined>()
  readonly onDidUpdatePullRequest: vscode.Event<PullRequest | undefined> = this._onDidUpdatePullRequest.event

  private _onDidUpdatePullRequests = new vscode.EventEmitter<PullRequestInfo[] | undefined>()
  readonly onDidUpdatePullRequests: vscode.Event<PullRequestInfo[] | undefined> = this._onDidUpdatePullRequests.event

  private _loadAttempts = 0
  private _loadTimeout: NodeJS.Timeout | undefined
  private _refreshTimeout: NodeJS.Timeout | undefined
  private _prsRefreshTimeout: NodeJS.Timeout | undefined

  private _disposables: vscode.Disposable[] = []

  constructor() {
    vscode.commands.executeCommand('setContext', RM_STATE_CONTEXT_KEY, this._state)
    vscode.commands.executeCommand('setContext', PR_STATE_CONTEXT_KEY, this._prState)
  }

  public async open(gitRepository: GitRepository) {
    const openRepository = async () => {
      this._current = gitRepository

      try {
        if (gitRepository.state.HEAD === undefined) {
          this.state = RepositoryManagerState.Initializing
        } else {
          if (!gitRepository.state.remotes[0]?.pushUrl) {
            this.state = RepositoryManagerState.NoRemote
            Logger.error('No remote found')
            return
          }

          const repo = parseGitRemote(gitRepository.state.remotes[0].pushUrl)
          const { data } = await Api.Repository.getRepository(repo.provider, repo.organization, repo.repository)
          const {
            data: { hasCoverageOverview },
          } = await Api.Repository.listCoverageReports(repo.provider, repo.organization, repo.repository)

          this._repository = data
          this._expectCoverage = hasCoverageOverview
          this._onDidLoadRepository.fire(data)

          this._disposables.push(this._current.state.onDidChange(this.handleStateChange.bind(this)))

          this.state = RepositoryManagerState.Loaded

          // trigger the pull requests load
          this.loadPullRequests()

          // trigger the pull request load
          this.loadPullRequest()
        }
      } catch (e) {
        if (e instanceof CoreApiError && !Config.apiToken) {
          this.state = RepositoryManagerState.NeedsAuthentication
        } else {
          handleError(e as Error)
          this.state = RepositoryManagerState.NoRepository
        }
      }
    }

    if (!Config.apiToken) {
      this.state = RepositoryManagerState.NeedsAuthentication
      return
    }

    if (this._current !== gitRepository) {
      vscode.window.withProgress({ location: { viewId: 'codacy:statuses' } }, openRepository)
    }
  }

  private handleStateChange() {
    // check if the branch changed
    if (this._current?.state.HEAD?.name !== this._branch) {
      Logger.appendLine(`Branch changed: ${this._current?.state.HEAD?.name}, looking for pull request...`)

      // update the branch
      this._branch = this._current?.state.HEAD?.name

      // clean up the pull request
      this._pullRequest = undefined
      this._onDidUpdatePullRequest.fire(undefined)
      this.prState = PullRequestState.NoPullRequest

      // trigger the pull requests load
      this.refreshPullRequests()

      // trigger the pull request load
      this.loadPullRequest()
    }

    // check if the user commit changes to the current branch
    else if (
      this._pullRequest &&
      this._prState === PullRequestState.Loaded &&
      this._pullRequest.meta.headCommitSHA &&
      this._current?.state.HEAD?.commit !== this._pullRequest.meta.headCommitSHA &&
      this._current?.state.HEAD?.ahead === 0
    ) {
      // trigger a delayed refresh
      this._refreshTimeout && clearTimeout(this._refreshTimeout)
      this._refreshTimeout = setTimeout(() => {
        Logger.appendLine(`Pushed all local commits, refreshing pull request...`)
        this._pullRequest?.refresh()
      }, 10000 /* 10 sec */)
    }
  }

  private async getOrFetchPullRequests(forceRefresh: boolean = false) {
    this._prsRefreshTimeout && clearTimeout(this._prsRefreshTimeout)
    if (this._state !== RepositoryManagerState.Loaded || !this._repository) return []
    const repo = this._repository

    if (this._pullRequests.length === 0 || forceRefresh) {
      try {
        Logger.appendLine(`Fetching pull requests for ${repo.provider}/${repo.owner}/${repo.name}`)

        // look for the pull request in the repository
        const { data: prs } = await Api.Analysis.listRepositoryPullRequests(repo.provider, repo.owner, repo.name, 100)

        // store all pull requests
        this._pullRequests = prs.map((pr) => new PullRequestInfo(pr, this._expectCoverage))
        this._onDidUpdatePullRequests.fire(this._pullRequests)

        // if any of the pull requests is loading, run a refresh again in N minutes
        if (this._pullRequests.some((pr) => pr.status.value === 'loading')) {
          this._prsRefreshTimeout = setTimeout(() => {
            this.refreshPullRequests()
          }, LOAD_RETRY_TIME)
        }
      } catch (e) {
        handleError(e as Error)
      }
    }

    return this._pullRequests
  }

  public async loadPullRequests() {
    if (this._state !== RepositoryManagerState.Loaded || !this._repository) return

    // we need to make this to run getOrFetchPullRequests in the context of 'this'
    const load = async () => await this.getOrFetchPullRequests()

    vscode.window.withProgress({ location: { viewId: 'codacy:pullRequests' } }, load)
  }

  public async refreshPullRequests() {
    if (this._state !== RepositoryManagerState.Loaded || !this._repository) return

    // we need to make this to run getOrFetchPullRequests in the context of 'this'
    const load = async () => await this.getOrFetchPullRequests(true)

    vscode.window.withProgress({ location: { viewId: 'codacy:pullRequests' } }, load)
  }

  public async loadPullRequest() {
    this._loadTimeout && clearTimeout(this._loadTimeout)
    if (this._state !== RepositoryManagerState.Loaded || !this._repository) return

    const repo = this._repository
    this._branch = this._current?.state.HEAD?.name

    if (!this._branch) {
      Logger.warn(`No HEAD information found: ${JSON.stringify(this._current?.state.HEAD)}`)
      this.prState = PullRequestState.NoPullRequest
      return
    }

    if (this._branch === repo.defaultBranch?.name) {
      Logger.appendLine(`Current branch is the default branch: ${this._branch}`)
      this.prState = PullRequestState.NoPullRequest
      return
    }

    const load = async () => {
      try {
        const prs = await this.getOrFetchPullRequests()
        const pr = prs.find((pr) => pr.analysis.pullRequest.originBranch === this._branch)

        if (!pr) {
          Logger.appendLine(`No PR found in Codacy for: ${this._branch}`)
          this.prState = PullRequestState.NoPullRequest

          // try again in N minutes
          if (this._loadAttempts < MAX_LOAD_ATTEMPTS) {
            this._loadTimeout = setTimeout(() => {
              this.loadPullRequest()
            }, LOAD_RETRY_TIME)
            this._loadAttempts++
          }

          return
        }

        if (pr.analysis.pullRequest.number === this._pullRequest?.meta.number) {
          // PR is the same, refresh it
          this._pullRequest.refresh()
        } else {
          // PR is different, create a new one
          this._pullRequest = new PullRequest(pr.analysis, this)

          // trigger the pull request load
          this._onDidUpdatePullRequest.fire(this._pullRequest)

          // subscribe to future pull request updates
          this._disposables.push(
            this._pullRequest.onDidUpdatePullRequest((pr) => {
              this._onDidUpdatePullRequest.fire(pr)
            })
          )
        }
        this.prState = PullRequestState.Loaded
      } catch (e) {
        handleError(e as Error)
      }
    }

    vscode.window.withProgress({ location: { viewId: 'codacy:statuses' } }, load)
  }

  public checkout(pullRequest: PullRequestInfo) {
    if (
      this._current &&
      pullRequest.analysis.pullRequest.originBranch &&
      this._current.state.HEAD?.name !== pullRequest.analysis.pullRequest.originBranch
    ) {
      Logger.appendLine(`Checking out ${pullRequest.analysis.pullRequest.originBranch}`)
      this._current.checkout(pullRequest.analysis.pullRequest.originBranch)
    }
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

  get pullRequests() {
    return this._pullRequests
  }

  get state() {
    return this._state
  }

  get head() {
    return this._current?.state.HEAD
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

  public dispose() {
    this.clear()
    this._disposables.forEach((d) => {
      d.dispose()
    })
  }
}
