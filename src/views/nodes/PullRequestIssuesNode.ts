import * as vscode from 'vscode'
import { PullRequest, PullRequestFile, PullRequestInfo } from '../../git/PullRequest'
import { PullRequestFileNode, PullRequestSummaryNode } from './'

export class PullRequestIssuesInfoNode extends PullRequestSummaryNode {
  constructor(_pr: PullRequestInfo) {
    const isUpToStandards = _pr.areGatesUpToStandards(['issueThreshold', 'securityIssueThreshold'])

    super(
      `${_pr.analysis.quality?.newIssues || 0} new issues (${_pr.analysis.quality?.fixedIssues || 0} fixed)`,
      'bug',
      vscode.TreeItemCollapsibleState.None,
      isUpToStandards !== undefined ? (isUpToStandards ? 'testing.iconPassed' : 'testing.iconFailed') : undefined
    )
  }
}

export class PullRequestIssuesNode extends PullRequestIssuesInfoNode {
  constructor(private readonly _pr: PullRequest) {
    super(_pr)

    this.collapsibleState =
      this.childrenFiles.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
  }

  get childrenFiles(): PullRequestFile[] {
    return this._pr.files.filter((file) => !!file.quality?.deltaNewIssues && file.quality?.deltaNewIssues > 0)
  }

  public async getChildren(): Promise<PullRequestFileNode[]> {
    return this.childrenFiles
      .sort((a, b) => (b.quality?.deltaNewIssues || 0) - (a.quality?.deltaNewIssues || 0))
      .map((file) => new PullRequestFileNode(file, 'issues'))
  }
}
