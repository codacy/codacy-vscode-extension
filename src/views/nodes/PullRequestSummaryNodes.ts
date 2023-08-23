import * as vscode from 'vscode'
import { PullRequest, PullRequestFile } from '../../git/PullRequest'

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
  constructor(private readonly _pr: PullRequest) {
    const { analysis } = _pr
    let status

    if (analysis.isAnalysing) status = ['Analyzing...', 'loading~spin']
    else if (analysis.isUpToStandards) status = ['Up to standards', 'check']
    else if (analysis.isUpToStandards === false) status = ['Not up to standards', 'error']
    else status = ['Not analysed', 'circle-slash']

    super(status[0], status[1])

    this.collapsibleState = analysis.isUpToStandards === false ? vscode.TreeItemCollapsibleState.Expanded : undefined
  }

  public async getChildren(): Promise<PullRequestSummaryNode[]> {
    const result = []
    // quality reasons
    // TODO: Quality doesn't have proper reasons yet, so we need to check and compare against the gates settings
    if (this._pr.gates?.qualityGate.issueThreshold && (this._pr.analysis?.newIssues || 0) > 0) {
      // TODO: This is a temporary solution and is buggy, bc we don't know the exact number of issues per category / severity
      const gate = this._pr.gates?.qualityGate.issueThreshold
      result.push(new PullRequestSummaryNode(`${gate.minimumSeverity || 'Info'} Issues > ${gate.threshold}`, 'bug'))
    }

    if (this._pr.gates?.qualityGate.securityIssueThreshold && (this._pr.analysis?.newIssues || 0) > 0) {
      // TODO: This is a temporary solution and is buggy, bc we don't know the exact number of issues per category / severity
      const gate = this._pr.gates?.qualityGate.securityIssueThreshold
      result.push(new PullRequestSummaryNode(`Security issues > ${gate}`, 'shield'))
    }

    if (this._pr.gates?.qualityGate.complexityThreshold && (this._pr.analysis?.deltaComplexity || 0) > 0) {
      const gate = this._pr.gates?.qualityGate.complexityThreshold
      result.push(new PullRequestSummaryNode(`Complexity > ${gate}`, 'type-hierarchy'))
    }

    if (this._pr.gates?.qualityGate.duplicationThreshold && (this._pr.analysis?.deltaClonesCount || 0) > 0) {
      const gate = this._pr.gates?.qualityGate.duplicationThreshold
      result.push(new PullRequestSummaryNode(`Duplication > ${gate}`, 'versions'))
    }

    // coverage reasons
    result.push(
      ...(this._pr.analysis?.coverage?.resultReasons
        ?.filter((r) => r.isUpToStandards === false)
        .map((r) => new PullRequestSummaryNode(`Coverage ${r.gate} < ${r.expected}`, 'beaker')) || [])
    )

    return result
  }
}

export class PullRequestIssuesNode extends PullRequestSummaryNode {
  constructor(private readonly _pr: PullRequest) {
    const { analysis } = _pr
    super(`${analysis.newIssues || 0} new issues (${analysis.fixedIssues || 0} fixed)`, 'bug')

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

export class PullRequestDuplicationNode extends PullRequestSummaryNode {
  constructor(private readonly _pr: PullRequest) {
    const { analysis } = _pr
    super(
      analysis.deltaClonesCount !== undefined
        ? analysis.deltaClonesCount > 0
          ? `${analysis.deltaClonesCount} new clones`
          : analysis.deltaClonesCount < 0
          ? `${analysis.deltaClonesCount * -1} fixed clones`
          : 'No new clones'
        : 'No duplication information',
      'versions'
    )

    this.collapsibleState =
      this.childrenFiles.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
  }

  get childrenFiles(): PullRequestFile[] {
    return this._pr.files.filter((file) => !!file.quality?.deltaClonesCount && file.quality?.deltaClonesCount > 0)
  }

  public async getChildren(): Promise<PullRequestFileNode[]> {
    return this.childrenFiles
      .sort((a, b) => (b.quality?.deltaClonesCount || 0) - (a.quality?.deltaClonesCount || 0))
      .map((file) => new PullRequestFileNode(file, 'duplication'))
  }
}

export class PullRequestComplexityNode extends PullRequestSummaryNode {
  constructor(private readonly _pr: PullRequest) {
    const { analysis } = _pr
    super(
      analysis.deltaComplexity !== undefined
        ? `${analysis.deltaComplexity} complexity increase`
        : 'No complexity information',
      'type-hierarchy'
    )

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

export class PullRequestCoverageNode extends PullRequestSummaryNode {
  constructor(private readonly _pr: PullRequest) {
    const { analysis } = _pr
    const messages = []

    if (analysis.coverage?.diffCoverage?.cause === 'ValueIsPresent') {
      messages.push(`${analysis.coverage.diffCoverage.value}% diff coverage`)
    }

    if (analysis.coverage?.deltaCoverage !== undefined) {
      messages.push(`${analysis.coverage.deltaCoverage > 0 ? '+' : ''}${analysis.coverage.deltaCoverage}% variation`)
    }

    super(messages.length ? messages.join(', ') : 'No coverage information', 'beaker')

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

export class PullRequestFileNode extends PullRequestSummaryNode {
  constructor(_file: PullRequestFile, _metric: 'issues' | 'complexity' | 'duplication' | 'coverage' = 'issues') {
    const { file, uri, quality, coverage } = _file
    const fileParts = file.path.split('/')

    super(fileParts.slice(-2).join('/'), 'file')

    this.tooltip = file.path
    this.resourceUri = uri
    this.command = {
      command: 'vscode.open',
      title: 'Open file',
      arguments: [uri],
    }

    switch (_metric) {
      case 'issues':
        this.description = quality?.deltaNewIssues
          ? `${quality.deltaNewIssues > 0 ? '+' : ''}${quality.deltaNewIssues}`
          : false
        break
      case 'complexity':
        this.description = quality?.deltaComplexity
          ? `${quality.deltaComplexity > 0 ? '+' : ''}${quality.deltaComplexity}`
          : false
        break
      case 'duplication':
        this.description = quality?.deltaClonesCount
          ? `${quality.deltaClonesCount > 0 ? '+' : ''}${quality.deltaClonesCount}`
          : false
        break
      case 'coverage':
        this.description =
          coverage?.deltaCoverage !== undefined
            ? `${coverage.deltaCoverage > 0 ? '+' : ''}${coverage.deltaCoverage}% variation`
            : coverage?.totalCoverage !== undefined
            ? `${coverage.totalCoverage}% total`
            : false
        break
      default:
        this.description = false
    }
  }
}
