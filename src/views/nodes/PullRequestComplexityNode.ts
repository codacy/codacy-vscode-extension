import * as vscode from 'vscode'
import { PullRequest, PullRequestFile, PullRequestInfo } from '../../git/PullRequest'
import { PullRequestFileNode, PullRequestSummaryNode } from './'

export class PullRequestComplexityInfoNode extends PullRequestSummaryNode {
  constructor(_pr: PullRequestInfo) {
    const deltaComplexity = _pr.analysis.quality?.deltaComplexity
    const isUpToStandards = _pr.areGatesUpToStandards(['complexityThreshold'])

    super(
      deltaComplexity !== undefined
        ? deltaComplexity !== 0
          ? `${deltaComplexity > 0 ? '+' : ''}${deltaComplexity} complexity ${
              deltaComplexity > 0 ? 'increase' : 'decrease'
            }`
          : 'No complexity variation'
        : 'No complexity information',
      'type-hierarchy',
      vscode.TreeItemCollapsibleState.None,
      isUpToStandards !== undefined ? (isUpToStandards ? 'testing.iconPassed' : 'testing.iconFailed') : undefined
    )
  }
}

export class PullRequestComplexityNode extends PullRequestComplexityInfoNode {
  constructor(private readonly _pr: PullRequest) {
    super(_pr)

    this.collapsibleState =
      this.childrenFiles.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
  }

  get childrenFiles(): PullRequestFile[] {
    return this._pr.files.filter((file) => !!file.quality?.deltaComplexity && file.quality?.deltaComplexity > 0)
  }

  public async getChildren(): Promise<PullRequestFileNode[]> {
    return this.childrenFiles
      .sort((a, b) => (b.quality?.deltaComplexity || 0) - (a.quality?.deltaComplexity || 0))
      .map((file) => new PullRequestFileNode(file, 'complexity'))
  }
}
