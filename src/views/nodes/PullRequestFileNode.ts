import { PullRequestFile } from '../../git/PullRequest'
import { PullRequestSummaryNode } from './PullRequestSummaryNode'

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
