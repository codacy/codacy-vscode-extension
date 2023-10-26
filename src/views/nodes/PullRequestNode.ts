import * as vscode from 'vscode'
import { PullRequestInfo } from '../../git/PullRequest'
import { PullRequestIssuesInfoNode } from './PullRequestIssuesNode'
import { PullRequestSummaryNode } from './PullRequestSummaryNode'
import { PullRequestDuplicationInfoNode } from './PullRequestDuplicationNode'
import { PullRequestCoverageInfoNode } from './PullRequestCoverageNode'
import { PullRequestComplexityInfoNode } from './PullRequestComplexityNode'
import { PullRequestAuthorNode } from './PullRequestAuthorNode'
import { PullRequestBranchNode } from './PullRequestBranchNode'

export class PullRequestNode extends vscode.TreeItem {
  constructor(private readonly _pr: PullRequestInfo) {
    super(_pr.analysis.pullRequest.title, vscode.TreeItemCollapsibleState.Collapsed)

    this.iconPath = new vscode.ThemeIcon(
      _pr.status.icon || 'circle-slash',
      ['passed', 'failed'].includes(_pr.status.value)
        ? new vscode.ThemeColor(_pr.status.value === 'passed' ? 'testing.iconPassed' : 'testing.iconFailed')
        : undefined
    )
    this.contextValue = 'pullRequest'
    this.description = `#${_pr.analysis.pullRequest.number.toString()}`

    this.tooltip = _pr.status.message
  }

  get parent(): PullRequestNode | undefined {
    return undefined
  }

  async getChildren(): Promise<PullRequestSummaryNode[]> {
    const authorNode = await PullRequestAuthorNode.create(this._pr)

    return [
      authorNode,
      new PullRequestBranchNode(this._pr),
      new PullRequestIssuesInfoNode(this._pr),
      ...(this._pr.expectCoverage ? [new PullRequestCoverageInfoNode(this._pr)] : []),
      new PullRequestDuplicationInfoNode(this._pr),
      new PullRequestComplexityInfoNode(this._pr),
    ]
  }

  get pullRequest(): PullRequestInfo {
    return this._pr
  }
}
