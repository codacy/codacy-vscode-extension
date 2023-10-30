import * as vscode from 'vscode'
import { PullRequestInfo } from '../../git/PullRequest'
import { PullRequestSummaryNode } from './'

export class PullRequestBranchNode extends vscode.TreeItem {
  constructor(_pr: PullRequestInfo) {
    super(_pr.analysis.pullRequest.originBranch || '(No origin branch)', vscode.TreeItemCollapsibleState.None)

    if (_pr.analysis.pullRequest.targetBranch) this.description = `→ ${_pr.analysis.pullRequest.targetBranch}`

    this.iconPath = new vscode.ThemeIcon('git-pull-request')
  }

  get parent(): PullRequestSummaryNode | undefined {
    return undefined
  }

  async getChildren(): Promise<PullRequestSummaryNode[]> {
    return []
  }
}
