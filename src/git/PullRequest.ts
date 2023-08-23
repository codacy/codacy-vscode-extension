import * as vscode from 'vscode'
import {
  CommitDeltaIssue,
  FileDeltaAnalysis,
  PullRequestWithAnalysis,
  QualitySettingsWithGatePolicy,
} from '../api/client'
import { RepositoryManager, RepositoryManagerState } from './RepositoryManager'
import { Api } from '../api'
import Logger from '../common/logger'

const MAX_IN_MEMORY_ITEMS = 300

export interface PullRequestIssue extends CommitDeltaIssue {
  uri?: vscode.Uri
}

export interface PullRequestFile extends FileDeltaAnalysis {
  uri?: vscode.Uri
}

export class PullRequest {
  private _prWithAnalysis: PullRequestWithAnalysis

  private _headCommit: string | undefined
  private _baseCommit: string | undefined

  private _issues: PullRequestIssue[]
  private _files: PullRequestFile[]
  private _gates: QualitySettingsWithGatePolicy | undefined

  private _onDidUpdatePullRequest = new vscode.EventEmitter<PullRequest>()
  readonly onDidUpdatePullRequest: vscode.Event<PullRequest> = this._onDidUpdatePullRequest.event

  constructor(
    prWithAnalysis: PullRequestWithAnalysis,
    private readonly _repositoryManager: RepositoryManager
  ) {
    this._prWithAnalysis = prWithAnalysis
    this._issues = []
    this._files = []

    this.refresh(true)
  }

  private ensureRepository() {
    if (
      this._repositoryManager.state !== RepositoryManagerState.Loaded ||
      this._repositoryManager.repository === undefined
    ) {
      throw new Error('Forbidden call')
    }

    return this._repositoryManager.repository
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

  private async fetchIssues() {
    const repo = this.ensureRepository()

    // TODO: this data should be part of the previous API call, or a new one
    // load PR origin and target commit SHAs
    const {
      data: { headCommit, commonAncestorCommit },
    } = await Api.Coverage.getPullRequestCoverageReports(
      repo.provider,
      repo.owner,
      repo.name,
      this._prWithAnalysis.pullRequest.number
    )

    this._headCommit = headCommit.commitSha
    this._baseCommit = commonAncestorCommit.commitSha

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
        nextCursor
      )

      this._issues.push(
        ...issues.map((issue) => ({
          ...issue,
          uri: vscode.Uri.parse(
            `https://app.codacy.com/${repo.provider}/${repo.owner}/${repo.name}/pullRequest?prid=${this.meta.id}#issue-${issue.commitIssue.issueId}`
          ),
        }))
      )
      nextCursor = pagination?.cursor
    } while (nextCursor && this._issues.length < MAX_IN_MEMORY_ITEMS)
  }

  private async fetchFiles() {
    const repo = this.ensureRepository()
    const baseUri = this._repositoryManager.rootUri?.path

    this._files = []
    let nextCursor: string | undefined

    // load PR files
    do {
      const { data: files, pagination } = await Api.Analysis.listPullRequestFiles(
        repo.provider,
        repo.owner,
        repo.name,
        this._prWithAnalysis.pullRequest.number,
        undefined,
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

  public async refresh(avoidMetadataFetch = false) {
    const fetch = async () => {
      if (!avoidMetadataFetch) await this.fetchMetadata()

      await this.fetchQualityGates()
      await this.fetchIssues()
      await this.fetchFiles()

      // all done, trigger the pull request update
      this._onDidUpdatePullRequest.fire(this)
      Logger.appendLine(`Updated pull request: ${JSON.stringify(this._prWithAnalysis)}`)
    }

    vscode.window.withProgress({ location: { viewId: 'codacy:statuses' } }, fetch)
  }

  get analysis() {
    return this._prWithAnalysis
  }

  get meta() {
    return this._prWithAnalysis.pullRequest
  }

  get gates() {
    return this._gates
  }

  get issues() {
    return this._issues
  }

  get files() {
    return this._files
  }
}
