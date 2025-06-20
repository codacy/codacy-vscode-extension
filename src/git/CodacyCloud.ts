import * as vscode from 'vscode'
import { Repository as GitRepository } from './git'
import Logger from '../common/logger'
import Telemetry from '../common/telemetry'
import { Config, handleError, parseGitRemote } from '../common'
import { Api } from '../api'
import { Branch, OpenAPIError, OrganizationWithMeta, RepositoryWithAnalysis } from '../api/client'
import { PullRequest, PullRequestInfo } from './PullRequest'
import { IssuesManager } from './IssuesManager'
import { checkFirstAnalysisStatus, getRepositoryCodacyCloudStatus } from '../onboarding'
import { GitProvider } from './GitProvider'
import { isMCPConfigured, createOrUpdateRules } from '../commands/configureMCP'
import { Cli } from '../cli'
import { CodacyCli } from '../cli/CodacyCli'

export enum CodacyCloudState {
  Initializing = 'Initializing',
  NeedsAuthentication = 'NeedsAuthentication',
  NoGitRepository = 'NoGitRepository',
  NeedsToJoinOrganization = 'NeedsToJoinOrganization',
  HasPendingJoinOrganization = 'HasPendingJoinOrganization',
  NeedsToAddOrganization = 'NeedsToAddOrganization',
  NeedsToAddRepository = 'NeedsToAddRepository',
  IsAnalyzing = 'IsAnalyzing',
  AnalysisFailed = 'AnalysisFailed',
  Loaded = 'Loaded',
  NoRepository = 'NoRepository',
}

export enum PullRequestState {
  NoPullRequest = 'NoPullRequest',
  Loaded = 'Loaded',
}

export enum BranchState {
  OnAnalysedBranch = 'OnAnalysedBranch',
  OnAnalysedBranchOutdated = 'OnAnalysedBranchOutdated',
  OnUnknownBranch = 'OnUnknownBranch',
  OnPullRequestBranch = 'OnPullRequestBranch',
}

const RM_STATE_CONTEXT_KEY = 'Codacy:CodacyCloudStateContext'
const PR_STATE_CONTEXT_KEY = 'Codacy:PullRequestStateContext'
const BR_STATE_CONTEXT_KEY = 'Codacy:BranchStateContext'

const LOAD_RETRY_TIME = 2 * 60 * 1000 // 2 minutes
const MAX_LOAD_ATTEMPTS = 5

export interface RepositoryParams {
  provider: 'bb' | 'gh' | 'gl'
  organization: string
  repository: string
}
export class CodacyCloud implements vscode.Disposable {
  private _current: GitRepository | undefined
  private _repository: RepositoryWithAnalysis | undefined
  private _organization: OrganizationWithMeta | undefined
  private _enabledBranches: Branch[] = []
  private _expectCoverage: boolean | undefined
  private _params: RepositoryParams | undefined
  private _state: CodacyCloudState = CodacyCloudState.Initializing

  private _branch: string | undefined
  private _pullRequest: PullRequest | undefined
  private _pullRequests: PullRequestInfo[] = []
  private _prState: PullRequestState = PullRequestState.NoPullRequest
  private _branchState: BranchState = BranchState.OnUnknownBranch
  private _issuesManager = new IssuesManager(this)

  private _onDidChangeState = new vscode.EventEmitter<CodacyCloudState>()
  readonly onDidChangeState: vscode.Event<CodacyCloudState> = this._onDidChangeState.event

  private _onDidLoadRepository = new vscode.EventEmitter<RepositoryWithAnalysis>()
  readonly onDidLoadRepository: vscode.Event<RepositoryWithAnalysis> = this._onDidLoadRepository.event

  private _onDidUpdatePullRequest = new vscode.EventEmitter<PullRequest | undefined>()
  readonly onDidUpdatePullRequest: vscode.Event<PullRequest | undefined> = this._onDidUpdatePullRequest.event

  private _onDidUpdatePullRequests = new vscode.EventEmitter<PullRequestInfo[] | undefined>()
  readonly onDidUpdatePullRequests: vscode.Event<PullRequestInfo[] | undefined> = this._onDidUpdatePullRequests.event

  private _loadAttempts = 0
  private _analysisAttempts = 0
  private _loadTimeout: NodeJS.Timeout | undefined
  private _refreshTimeout: NodeJS.Timeout | undefined
  private _prsRefreshTimeout: NodeJS.Timeout | undefined
  private _analysisCheckTimeout: NodeJS.Timeout | undefined

  private _cli: CodacyCli | undefined

  private _disposables: vscode.Disposable[] = []

  constructor() {
    vscode.commands.executeCommand('setContext', RM_STATE_CONTEXT_KEY, this._state)
    vscode.commands.executeCommand('setContext', PR_STATE_CONTEXT_KEY, this._prState)
    vscode.commands.executeCommand('setContext', BR_STATE_CONTEXT_KEY, this._branchState)
  }

  public async open(gitRepository: GitRepository) {
    const openRepository = async () => {
      this._current = gitRepository
      this._cli = await Cli.get(this._params ?? {})

      try {
        if (gitRepository.state.HEAD === undefined) {
          this.state = CodacyCloudState.Initializing
        } else {
          const remotesWithPushUrl = gitRepository.state.remotes.filter((remote) => remote.pushUrl)

          if (remotesWithPushUrl.length === 0) {
            this.state = CodacyCloudState.NoGitRepository
            Logger.error('No remote found')
            return
          }

          let remoteIdx = 0
          this._repository = undefined

          while (this._repository === undefined && remoteIdx < remotesWithPushUrl.length) {
            const { provider, organization, repository } = parseGitRemote(remotesWithPushUrl[remoteIdx].pushUrl!)
            this._params = { provider, organization, repository }

            if (isMCPConfigured()) {
              await createOrUpdateRules({ provider, organization, repository })
            }

            try {
              // load repository information
              const { data } = await Api.Analysis.getRepositoryWithAnalysis(provider, organization, repository)

              this._repository = data
              this._cli = await Cli.get(this._params ?? {})

              if (!data.lastAnalysedCommit) {
                const status = await checkFirstAnalysisStatus(provider, organization, repository)
                if (
                  (status && status.length === 0) ||
                  data.repository.problems.some((problem) =>
                    ['no_supported_languages', 'empty_repository'].includes(problem.code)
                  )
                ) {
                  this.state = CodacyCloudState.AnalysisFailed
                  return
                } else {
                  this.state = CodacyCloudState.IsAnalyzing
                  this.checkRepositoryAnalysisStatus()
                  return
                }
              }
            } catch (error) {
              remoteIdx++
            }
          }

          if (this._repository === undefined) {
            // repository not found, check for codacy cloud status
            if (this._params) {
              const status = await getRepositoryCodacyCloudStatus(this._params.provider, this._params.organization)
              this.state = status
            } else {
              this.state = CodacyCloudState.NoRepository
            }

            Logger.error('No repository found')
            return
          }

          const { name: repository, owner, provider } = this._repository.repository

          const { data: organization } = await Api.Organization.getOrganization(provider, owner)
          this._organization = organization

          // does the repository have coverage data?
          const {
            data: { hasCoverageOverview },
          } = await Api.Repository.listCoverageReports(provider, owner, repository)

          // get all branches
          const { data: enabledBranches } = await Api.Repository.listRepositoryBranches(
            provider,
            owner,
            repository,
            true
          )

          this._expectCoverage = hasCoverageOverview
          this._enabledBranches = enabledBranches

          this._disposables.push(this._current.state.onDidChange(this.handleStateChange.bind(this)))

          this.state = CodacyCloudState.Loaded

          this._onDidLoadRepository.fire(this._repository)

          await this.handleBranchChange()
        }
      } catch (e) {
        if (e instanceof OpenAPIError && !Config.apiToken) {
          console.error(e)
          this.state = CodacyCloudState.NeedsAuthentication
        } else {
          handleError(e as Error)
          this.state = CodacyCloudState.NoRepository
        }
      }
    }

    if (!Config.apiToken) {
      this.state = CodacyCloudState.NeedsAuthentication
      return
    }

    if (this._current !== gitRepository) {
      vscode.window.withProgress({ location: { viewId: 'codacy:cloud-status' } }, openRepository)
    }
  }

  public async checkRepositoryAnalysisStatus() {
    this._analysisCheckTimeout && clearTimeout(this._analysisCheckTimeout)

    // Exit if state changed or missing params
    if (this._state !== CodacyCloudState.IsAnalyzing || !this._params) return
    const { provider, organization, repository } = this._params

    const check = async () => {
      try {
        const { data } = await Api.Analysis.getRepositoryWithAnalysis(provider, organization, repository)

        // Analysis completed
        if (data.lastAnalysedCommit) {
          this._repository = data
          this.state = CodacyCloudState.Loaded
          await vscode.window.showInformationMessage('Analysis completed. Please restart the IDE.')
          return
        }

        // Analysis still in progress
        if (this._analysisAttempts < MAX_LOAD_ATTEMPTS) {
          this._analysisAttempts++
          Logger.appendLine(
            `Analysis check attempt ${this._analysisAttempts}/${MAX_LOAD_ATTEMPTS}. Next check in ${
              LOAD_RETRY_TIME / 60000
            } minutes.`
          )
          this._analysisCheckTimeout = setTimeout(() => this.checkRepositoryAnalysisStatus(), LOAD_RETRY_TIME)
        } else {
          Logger.appendLine(`Maximum analysis check attempts reached. Stopping automatic checks.`)
          await vscode.window.showWarningMessage(
            'Repository analysis is taking longer than expected. You may need to restart your IDE later to see the results.'
          )
        }
      } catch (error) {
        handleError(error as Error)

        // Stop checking on errors
        Logger.appendLine('Error occurred during analysis check. Stopping automatic checks.')
      }
    }

    vscode.window.withProgress({ location: { viewId: 'codacy:cloud-status' } }, check)
  }

  private async handleBranchChange() {
    // update pull requests to be up to date
    await this.refreshPullRequests()

    this._branch = this._current?.state.HEAD?.name

    if (!this._branch) {
      Logger.warn(`No HEAD information found: ${JSON.stringify(this._current?.state.HEAD)}`)
      this.prState = PullRequestState.NoPullRequest
      this.branchState = BranchState.OnUnknownBranch
    }

    // in which kind of branch are we? (PR, analysed, unknown)
    else if (this._enabledBranches.some((b) => b.name === this._branch)) {
      Logger.appendLine(
        `Current branch is an analyzed branch: ${this._branch}. Skipped looking for a pull request. Loading branch issues...`
      )
      this.prState = PullRequestState.NoPullRequest

      this.loadIssues()
    }

    // otherwise, try to find a pull request
    else {
      this.loadPullRequest()
    }
  }

  public loadIssues(retryOnFailure = false) {
    // if the local branch's HEAD is not the same as the remote branch's HEAD, then the local branch is outdated
    if (this.head?.commit !== this.lastAnalysedCommit?.sha) {
      Logger.appendLine(
        `Local branch '${this._branch}' is outdated: Local Head ${this.head?.commit?.substring(
          0,
          7
        )} !== Last analysed Head ${this.lastAnalysedCommit?.sha.substring(0, 7)}`
      )
      this.branchState = BranchState.OnAnalysedBranchOutdated

      if (retryOnFailure) {
        // try again in N minutes
        this._refreshTimeout && clearTimeout(this._refreshTimeout)
        this._refreshTimeout = setTimeout(() => {
          Logger.appendLine(`Retrying to load branch issues...`)
          this.loadIssues()
        }, LOAD_RETRY_TIME)
      }
    } else {
      // load branch issues
      this.branchState = BranchState.OnAnalysedBranch
      this._issuesManager.refresh()
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

      // clean up the issues and branch state
      this._issuesManager.clear()
      this.branchState = BranchState.OnUnknownBranch

      // trigger the pull requests load
      this.refreshPullRequests()

      this.handleBranchChange()
    }

    // check if the user commit changes to the current PR branch and pushed them
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
        Logger.appendLine(`Up to date with remote, refreshing pull request...`)
        this._pullRequest?.refresh()
      }, 10000 /* 10 sec */)
    }

    // check if the user pushed changes directly to an analysed branch
    else if (
      (this._branchState === BranchState.OnAnalysedBranch ||
        this._branchState === BranchState.OnAnalysedBranchOutdated) &&
      this._current?.state.HEAD?.ahead === 0
    ) {
      // trigger a delayed refresh
      this._refreshTimeout && clearTimeout(this._refreshTimeout)
      this._refreshTimeout = setTimeout(() => {
        Logger.appendLine(`Up to date with remote, refreshing branch issues...`)
        this.loadIssues(true)
      }, 10000 /* 10 sec */)
    }
  }

  private async getOrFetchPullRequests() {
    this._prsRefreshTimeout && clearTimeout(this._prsRefreshTimeout)
    if (this._state !== CodacyCloudState.Loaded || !this._repository) return []
    const repo = this._repository.repository

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

    return this._pullRequests
  }

  public async refreshPullRequests() {
    if (this._state !== CodacyCloudState.Loaded || !this._repository) return

    // we need to make this to run getOrFetchPullRequests in the context of 'this'
    const load = async () => await this.getOrFetchPullRequests()

    vscode.window.withProgress({ location: { viewId: 'codacy:pullRequests' } }, load)
  }

  public async loadPullRequest() {
    this._loadTimeout && clearTimeout(this._loadTimeout)
    if (this._state !== CodacyCloudState.Loaded || !this._repository) return

    const load = async () => {
      try {
        const prs = await this.getOrFetchPullRequests()
        const pr = prs.find((pr) => pr.analysis.pullRequest.originBranch === this._branch)

        if (!pr) {
          Logger.appendLine(`No PR found in Codacy for: ${this._branch}`)
          this.prState = PullRequestState.NoPullRequest
          this.branchState = BranchState.OnUnknownBranch

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
        this.branchState = BranchState.OnPullRequestBranch
        this._issuesManager.clear()
      } catch (e) {
        handleError(e as Error)
      }
    }

    vscode.window.withProgress({ location: { viewId: 'codacy:cloud-status' } }, load)
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

  public async clear() {
    this._current = undefined
    // Clean up the rules file of repository information
    if (isMCPConfigured()) createOrUpdateRules()
    if (!Config.apiToken) {
      this.state = CodacyCloudState.NeedsAuthentication
    } else {
      this.state = CodacyCloudState.NoGitRepository
    }
    this._cli = await Cli.get({})
  }

  public refresh() {
    if (!this._current) return

    switch (this._state) {
      case CodacyCloudState.Loaded:
      case CodacyCloudState.IsAnalyzing:
      case CodacyCloudState.AnalysisFailed:
        this.refreshPullRequests()
        break
      case CodacyCloudState.NoRepository:
      case CodacyCloudState.Initializing:
      case CodacyCloudState.NeedsAuthentication:
      case CodacyCloudState.NeedsToJoinOrganization:
      case CodacyCloudState.HasPendingJoinOrganization:
      case CodacyCloudState.NeedsToAddOrganization:
      case CodacyCloudState.NeedsToAddRepository:
        this.open(this._current)
        break
      case CodacyCloudState.NoGitRepository:
        if (GitProvider.instance?.repositories.length) {
          this.open(GitProvider.instance?.repositories[0])
        }
        break
    }
  }

  get repository() {
    return this._repository?.repository
  }

  get params() {
    return this._params
  }

  get lastAnalysedCommit() {
    return this._repository?.lastAnalysedCommit
  }

  get branchIssues() {
    return this._issuesManager
  }

  get pullRequest() {
    return this._pullRequest
  }

  get pullRequests() {
    return this._pullRequests
  }

  get enabledBranches() {
    return this._enabledBranches
  }

  get state() {
    return this._state
  }

  get cli() {
    return this._cli
  }

  get head() {
    return this._current?.state.HEAD
  }

  get rootUri() {
    return this._current?.rootUri
  }

  get expectCoverage() {
    return this._expectCoverage
  }

  set state(state: CodacyCloudState) {
    const stateChange = state !== this._state
    this._state = state
    if (stateChange) {
      vscode.commands.executeCommand('setContext', RM_STATE_CONTEXT_KEY, state)
      this._onDidChangeState.fire(state)
      Telemetry.track('Repository State Change', {
        state,
        organization_id: this._organization?.organization.identifier,
      })
    }
  }

  set prState(state: PullRequestState) {
    const stateChange = state !== this._prState
    this._prState = state
    if (stateChange) {
      vscode.commands.executeCommand('setContext', PR_STATE_CONTEXT_KEY, state)
      Telemetry.track('Pull Request State Change', {
        state,
        organization_id: this._organization?.organization.identifier,
      })
    }
  }

  set branchState(state: BranchState) {
    const stateChange = state !== this._branchState
    this._branchState = state
    if (stateChange) {
      vscode.commands.executeCommand('setContext', BR_STATE_CONTEXT_KEY, state)
      Telemetry.track('Branch State Change', {
        state,
        organization_id: this._organization?.organization.identifier,
      })
    }
  }

  public dispose() {
    this.clear()
    this._disposables.forEach((d) => {
      d.dispose()
    })
  }
}
