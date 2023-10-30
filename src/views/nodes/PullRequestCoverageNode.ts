import * as vscode from 'vscode'
import { PullRequest, PullRequestFile, PullRequestInfo } from '../../git/PullRequest'
import { PullRequestFileNode, PullRequestSummaryNode } from './'

export class PullRequestCoverageInfoNode extends PullRequestSummaryNode {
  constructor(_pr: PullRequestInfo) {
    const { analysis } = _pr
    const messages = []
    const isUpToStandards = _pr.areGatesUpToStandards(['coverageThreshold', 'diffCoverageThreshold'])

    if (analysis.coverage?.diffCoverage?.cause === 'ValueIsPresent') {
      messages.push(`${analysis.coverage.diffCoverage.value}% diff coverage`)
    }

    if (analysis.coverage?.deltaCoverage !== undefined) {
      messages.push(`${analysis.coverage.deltaCoverage > 0 ? '+' : ''}${analysis.coverage.deltaCoverage}% variation`)
    }

    super(
      messages.length ? messages.join(', ') : 'No coverage information',
      'beaker',
      vscode.TreeItemCollapsibleState.None,
      isUpToStandards !== undefined ? (isUpToStandards ? 'testing.iconPassed' : 'testing.iconFailed') : undefined
    )
  }
}

export class PullRequestCoverageNode extends PullRequestCoverageInfoNode {
  constructor(private readonly _pr: PullRequest) {
    super(_pr)

    this.collapsibleState =
      this.childrenFiles.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
  }

  get childrenFiles(): PullRequestFile[] {
    return this._pr.files.filter(
      (file) => file.coverage?.deltaCoverage !== undefined || file.coverage?.totalCoverage !== undefined
    )
  }

  public async getChildren(): Promise<PullRequestFileNode[]> {
    return this.childrenFiles
      .sort((a, b) => {
        if (a.coverage?.deltaCoverage !== undefined && b.coverage?.deltaCoverage !== undefined)
          return a.coverage?.deltaCoverage - b.coverage?.deltaCoverage
        else if (a.coverage?.totalCoverage !== undefined && b.coverage?.totalCoverage !== undefined)
          return b.coverage?.totalCoverage - a.coverage?.totalCoverage + 1000
        else return 0
      })
      .map((file) => new PullRequestFileNode(file, 'coverage'))
  }
}
