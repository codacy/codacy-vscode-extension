import * as vscode from 'vscode'
import { PullRequest } from '../../git/PullRequest'
import { SEVERITY_LEVEL_MAP, REASON_MAP } from '../../common/glossary'
import { KNOWN_REASONS, Reason } from '../../common/types'

export class LocalToolsNode extends vscode.TreeItem {
  constructor(label: string, icon?: string, collapsibleState?: vscode.TreeItemCollapsibleState, colorId?: string) {
    super(label, collapsibleState || vscode.TreeItemCollapsibleState.None)
    this.iconPath = icon ? new vscode.ThemeIcon(icon, colorId ? new vscode.ThemeColor(colorId) : undefined) : undefined
  }

  get parent(): LocalToolsNode | undefined {
    return undefined
  }

  async getChildren(): Promise<LocalToolsNode[]> {
    return []
  }
}

export class LocalToolsInformationNode extends LocalToolsNode {
  constructor(private readonly _pr: PullRequest) {
    super(_pr.status.message, _pr.status.icon, undefined, _pr.status.colorId)

    this.collapsibleState = _pr.status.value === 'failed' ? vscode.TreeItemCollapsibleState.Expanded : undefined
    this.description = _pr.status.details
  }

  public async getChildren(): Promise<LocalToolsNode[]> {
    return [...(this._pr.analysis?.quality?.resultReasons || []), ...(this._pr.analysis?.coverage?.resultReasons || [])]
      .filter((r) => r.isUpToStandards === false && KNOWN_REASONS.includes(r.gate as Reason))
      .map((r) => {
        const reason = REASON_MAP[r.gate as Reason]
        const minimumSeverityPrefix = r.expectedThreshold.minimumSeverity
          ? `${SEVERITY_LEVEL_MAP[r.expectedThreshold.minimumSeverity].label} `
          : ''
        return new LocalToolsNode(
          `${minimumSeverityPrefix}${reason.label} ${reason.sign} ${r.expectedThreshold.threshold}`,
          reason.icon
        )
      })
  }
}
