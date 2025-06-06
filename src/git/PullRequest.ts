import * as vscode from 'vscode'
import {
  CommitDeltaIssue,
  FileDeltaAnalysis,
  DiffLineHit,
  PullRequestWithAnalysis,
  QualitySettingsWithGatePolicy,
} from '../api/client'
import { CodacyCloud, CodacyCloudState } from './CodacyCloud'
import { Api } from '../api'
import { QualityStatusResponse, getQualityStatus } from '../common/commitStatusHelper'
import { Reason } from '../common/types'

const MAX_IN_MEMORY_ITEMS = 300

const PR_REFRESH_TIME = 1 * 60 * 1000

export interface PullRequestIssue extends CommitDeltaIssue {
  uri?: vscode.Uri
}

export interface PullRequestFile extends FileDeltaAnalysis {
  uri?: vscode.Uri
}

export class PullRequestInfo {
  _status: QualityStatusResponse

  constructor(
    protected _prWithAnalysis: PullRequestWithAnalysis,
    public expectCoverage?: boolean
  ) {
    this._status = getQualityStatus(_prWithAnalysis, !!expectCoverage)
  }

  get analysis() {
    return this._prWithAnalysis
  }

  get status() {
    return this._status
  }

  get reasons() {
    return [...(this.analysis.quality?.resultReasons || []), ...(this.analysis.coverage?.resultReasons || [])]
  }

  public areGatesUpToStandards(gates: Reason[]): boolean | undefined {
    const reasons = this.reasons.filter((r) => gates.includes(r.gate as Reason))
    if (reasons.length === 0) return undefined
    else if (reasons.some((r) => r.isUpToStandards === false)) return false
    else if (reasons.every((r) => r.isUpToStandards === true)) return true

    return undefined
  }
}

export class PullRequest extends PullRequestInfo {
  private _headCommit: string | undefined
  private _baseCommit: string | undefined

  private _issues: PullRequestIssue[]
  private _files: PullRequestFile[]
  private _gates: QualitySettingsWithGatePolicy | undefined
  private _diffCoverageLineHits: Map<string, DiffLineHit[]>
  public displayCoverage: boolean

  private _onDidUpdatePullRequest = new vscode.EventEmitter<PullRequest>()
  readonly onDidUpdatePullRequest: vscode.Event<PullRequest> = this._onDidUpdatePullRequest.event

  private _refreshTimeout: NodeJS.Timeout | undefined

  constructor(
    prWithAnalysis: PullRequestWithAnalysis,
    private readonly _codacyCloud: CodacyCloud
  ) {
    super(prWithAnalysis, _codacyCloud.expectCoverage)

    this._prWithAnalysis = prWithAnalysis
    this._issues = []
    this._files = []
    this._diffCoverageLineHits = new Map<string, DiffLineHit[]>()

    this.displayCoverage = !!_codacyCloud.expectCoverage

    this.refresh(true)
  }

  private ensureRepository() {
    if (this._codacyCloud.state !== CodacyCloudState.Loaded || this._codacyCloud.repository === undefined) {
      throw new Error('Forbidden call')
    }

    return this._codacyCloud.repository
  }

  private async fetchMetadata() {
    const repo = this.ensureRepository()
    // load PR metadata and analysis information
    const prAnalysis = await Api.Analysis.getRepositoryPullRequest(
      repo.provider,
      repo.owner,
      repo.name,
      this._prWithAnalysis.pullRequest.number
    )

    this._prWithAnalysis = prAnalysis
  }

  private async fetchQualityGates() {
    const repo = this.ensureRepository()

    // load PR quality gates
    const { data: gates } = await Api.Repository.getPullRequestQualitySettings(repo.provider, repo.owner, repo.name)

    this._gates = gates
  }

  private async fetchCoverage() {
    const repo = this.ensureRepository()

    const coverageResponse = await Api.Coverage.getRepositoryPullRequestFilesCoverage(
      repo.provider,
      repo.owner,
      repo.name,
      this._prWithAnalysis.pullRequest.number
    )

    const coverageData = coverageResponse.data
    for (let i = 0; i < coverageData.length; i++) {
      this._diffCoverageLineHits.set(coverageData[i].fileName, coverageData[i].diffLineHits)
    }
  }

  private async fetchIssues() {
    const repo = this.ensureRepository()

    // Coverage
    if (this.expectCoverage) {
      await this.fetchCoverage()
    }

    // Issues
    this._headCommit = this._prWithAnalysis.pullRequest.headCommitSha
    this._baseCommit = this._prWithAnalysis.pullRequest.commonAncestorCommitSha

    // load PR delta issues
    this._issues = []
    let nextCursor: string | undefined

    do {
      const { data: issues, pagination } = await Api.Analysis.listCommitDeltaIssues(
        repo.provider,
        repo.owner,
        repo.name,
        this._headCommit,
        this._baseCommit,
        undefined,
        undefined,
        nextCursor
      )

      this._issues.push(
        ...issues.map((issue) => ({
          ...issue,
          uri: vscode.Uri.parse(
            `https://app.codacy.com/${repo.provider}/${repo.owner}/${repo.name}/pull-requests/${this.meta.number}/issues#issue-${issue.commitIssue.issueId}`
          ),
        }))
      )
      nextCursor = pagination?.cursor
    } while (nextCursor && this._issues.length < MAX_IN_MEMORY_ITEMS)
  }

  private async fetchFiles() {
    const repo = this.ensureRepository()
    const baseUri = this._codacyCloud.rootUri?.path

    this._files = []
    let nextCursor: string | undefined

    // load PR files
    do {
      const { data: files, pagination } = await Api.Analysis.listPullRequestFiles(
        repo.provider,
        repo.owner,
        repo.name,
        this._prWithAnalysis.pullRequest.number,
        nextCursor
      )

      this._files.push(
        ...(files || []).map((file) => ({
          ...file,
          uri: vscode.Uri.file(`${baseUri}/${file.file.path}`),
        }))
      )

      nextCursor = pagination?.cursor
    } while (nextCursor && this._files.length < MAX_IN_MEMORY_ITEMS)
  }

  private showAnalysisNotification() {
    if (this.analysis.isUpToStandards) {
      if (
        (this.analysis.quality?.newIssues || 0) > 0 ||
        (this.analysis.quality?.deltaClonesCount || 0) > 0 ||
        (this.analysis.quality?.deltaComplexity || 0) > 0 ||
        (this.analysis.coverage?.deltaCoverage !== undefined && this.analysis.coverage?.deltaCoverage < -0.05) ||
        (this.analysis.coverage?.diffCoverage?.value !== undefined && this.analysis.coverage?.diffCoverage?.value < 50)
      ) {
        vscode.window
          .showWarningMessage(
            `Your pull request is up to standards! Check how to improve your code even more`,
            'Show results'
          )
          .then((value) => {
            if (value === 'Show results') {
              vscode.commands.executeCommand('codacy.pr.openSummary')
            }
          })
      } else {
        vscode.window.showInformationMessage(`Your pull request is up to standards!`)
      }
    } else {
      vscode.window.showWarningMessage('Your pull request is not up to standards', 'Show problems').then((value) => {
        if (value === 'Show problems') {
          vscode.commands.executeCommand('codacy.pr.openSummary')
        }
      })
    }
  }

  public async refresh(avoidMetadataFetch = false) {
    const fetch = async () => {
      const wasAnalysing = this.analysis.isAnalysing

      if (!avoidMetadataFetch) await this.fetchMetadata()

      await this.fetchQualityGates()
      await this.fetchIssues()
      await this.fetchFiles()
      vscode.commands.executeCommand('codacy.pr.refreshCoverageDecoration')

      // all done, trigger the pull request update
      this._onDidUpdatePullRequest.fire(this)

      // if the PR is still analysing, or...
      // if commit heads don't match, and everything was pushed, try again
      if (
        this.analysis.isAnalysing ||
        (this._headCommit !== this._codacyCloud.head?.commit && this._codacyCloud.head?.ahead === 0)
      ) {
        this._refreshTimeout && clearTimeout(this._refreshTimeout)
        this._refreshTimeout = setTimeout(() => {
          this.refresh()
        }, PR_REFRESH_TIME)
      } else if (wasAnalysing) {
        // PR has new results, show a notification depending on them
        this.showAnalysisNotification()
      }
    }

    vscode.window.withProgress({ location: { viewId: 'codacy:prSummary' } }, fetch)
  }

  get meta() {
    return {
      ...this._prWithAnalysis.pullRequest,
      headCommitSHA: this._headCommit,
      commonAncestorCommitSHA: this._baseCommit,
    }
  }

  get gates() {
    return this._gates
  }

  get issues() {
    return this._issues
  }

  get coverage() {
    return this._diffCoverageLineHits
  }

  get files() {
    return this._files
  }
}
