import * as vscode from 'vscode'
import { PullRequest, PullRequestFile, PullRequestInfo } from '../../git/PullRequest'
import { PullRequestFileNode, PullRequestSummaryNode } from './'

export class PullRequestDuplicationInfoNode extends PullRequestSummaryNode {
  constructor(_pr: PullRequestInfo) {
    const deltaClones = _pr.analysis.quality?.deltaClonesCount
    const isUpToStandards = _pr.areGatesUpToStandards(['duplicationThreshold'])

    super(
      deltaClones !== undefined
        ? deltaClones !== 0
          ? `${deltaClones > 0 ? '+' : ''}${deltaClones} duplication ${deltaClones > 0 ? 'increase' : 'decrease'}`
          : 'No duplication variation'
        : 'No duplication information',
      'versions',
      vscode.TreeItemCollapsibleState.None,
      isUpToStandards !== undefined ? (isUpToStandards ? 'testing.iconPassed' : 'testing.iconFailed') : undefined
    )
  }
}

export class PullRequestDuplicationNode extends PullRequestDuplicationInfoNode {
  constructor(private readonly _pr: PullRequest) {
    super(_pr)

    this.collapsibleState =
      this.childrenFiles.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
  }

  get childrenFiles(): PullRequestFile[] {
    return this._pr.files.filter((file) => !!file.quality?.deltaClonesCount)
  }

  public async getChildren(): Promise<PullRequestFileNode[]> {
    return this.childrenFiles
      .sort((a, b) => (b.quality?.deltaClonesCount || 0) - (a.quality?.deltaClonesCount || 0))
      .map((file) => new PullRequestFileNode(file, 'duplication'))
  }
}
