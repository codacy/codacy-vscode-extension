import * as vscode from 'vscode'
import { PullRequestWithAnalysis } from '../../api/client'

export class PullRequestSummaryNode extends vscode.TreeItem {
  constructor(label: string, icon?: string, collapsibleState?: vscode.TreeItemCollapsibleState) {
    super(label, collapsibleState || vscode.TreeItemCollapsibleState.None)
    this.iconPath = icon ? new vscode.ThemeIcon(icon) : undefined
  }

  get parent(): PullRequestSummaryNode | undefined {
    return undefined
  }

  async getChildren(): Promise<PullRequestSummaryNode[]> {
    return []
  }
}

export class PullRequestInformationNode extends PullRequestSummaryNode {
  constructor(data: PullRequestWithAnalysis) {
    let status

    if (data.isAnalysing) status = ['Analysing...', 'loading~spin']
    else if (data.isUpToStandards) status = ['Up to standards', 'check']
    else if (data.isUpToStandards === false) status = ['Not up to standards', 'error']
    else status = ['Not analysed', 'circle-slash']

    super(status[0], status[1])
  }
}

export class PullRequestIssuesNode extends PullRequestSummaryNode {
  constructor(data: PullRequestWithAnalysis) {
    super(`${data.newIssues || 0} new issues (${data.fixedIssues || 0} fixed)`, 'bug')
  }
}

export class PullRequestDuplicationNode extends PullRequestSummaryNode {
  constructor(data: PullRequestWithAnalysis) {
    super(
      data.deltaClonesCount !== undefined ? `${data.deltaClonesCount || 0} new clones` : 'No duplication information',
      'versions'
    )
  }
}

export class PullRequestComplexityNode extends PullRequestSummaryNode {
  constructor(data: PullRequestWithAnalysis) {
    super(
      data.deltaComplexity !== undefined ? `${data.deltaComplexity} complexity increase` : 'No complexity information',
      'watch'
    )
  }
}

export class PullRequestCoverageNode extends PullRequestSummaryNode {
  constructor(data: PullRequestWithAnalysis) {
    let diffCoverageMsg

    if (data.coverage !== undefined) {
      if (data.coverage.diffCoverage?.cause === 'ValueIsPresent') {
        diffCoverageMsg = `${data.coverage.diffCoverage.value}% diff coverage, `
      } else {
        diffCoverageMsg = ''
      }
    }

    super(
      data.coverage === undefined ||
        (data.coverage.diffCoverage?.cause === 'MissingRequirements' && data.coverage.deltaCoverage === undefined)
        ? 'No coverage information'
        : `${diffCoverageMsg}${data.coverage.deltaCoverage && data.coverage.deltaCoverage > 0 ? '+' : ''}${
            data.coverage.deltaCoverage || 0
          }% variation`,
      'beaker'
    )
  }
}
