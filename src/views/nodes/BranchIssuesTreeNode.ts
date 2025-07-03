import * as vscode from 'vscode'
import { BranchIssue } from '../../git/IssuesManager'
import { groupBy } from 'lodash'
import { CATEGORY_LEVEL_MAP, CodePatternCategory, SEVERITY_LEVEL_MAP } from '../../common/glossary'
import { SeverityLevel } from '../../api/client'

export class BranchIssuesTreeNode extends vscode.TreeItem {
  constructor(label: string, icon?: string, collapsibleState?: vscode.TreeItemCollapsibleState) {
    super(label, collapsibleState || vscode.TreeItemCollapsibleState.None)
    this.iconPath = icon ? new vscode.ThemeIcon(icon) : undefined
  }

  get parent(): BranchIssuesTreeNode | undefined {
    return undefined
  }

  async getChildren(): Promise<BranchIssuesTreeNode[]> {
    return []
  }
}

export class BranchIssueFileNode extends BranchIssuesTreeNode {
  constructor(_uri: vscode.Uri, _count?: number) {
    const fileParts = _uri.path.split('/')

    super(fileParts.slice(-2).join('/'), 'file')

    this.tooltip = _uri.path
    this.resourceUri = _uri

    this.command = {
      command: 'vscode.open',
      title: 'Open file',
      arguments: [this.resourceUri],
    }

    this.description = _count ? `${_count}` : false
  }
}

export class BranchIssuesTreeCategoryNode extends BranchIssuesTreeNode {
  private _childrenIssues: BranchIssue[] = []

  constructor(
    label: string,
    icon?: string,
    _children?: BranchIssue[] | (() => BranchIssue[]),
    private readonly _baseUri: string = '',
    _hideCount?: boolean
  ) {
    const issues = typeof _children === 'function' ? _children() : _children || []
    super(
      label,
      icon,
      issues.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
    )

    this._childrenIssues = issues
    if (!_hideCount) this.description = `(${issues.length})`
  }

  public async getChildren(): Promise<BranchIssuesTreeNode[]> {
    const files = groupBy(this._childrenIssues, ({ commitIssue: i }) => i.filePath)
    const filesWithCount = Object.entries(files)
      .map<[string, number]>(([path, items]) => [path, items.length])
      .sort((a, b) => b[1] - a[1])
    return filesWithCount.map(
      ([path, count]) => new BranchIssueFileNode(vscode.Uri.file(`${this._baseUri}/${path}`), count)
    )
  }
}

export class BranchIssuesTreeGroupByCategoryNode extends BranchIssuesTreeNode {
  constructor(
    private readonly _allIssues: BranchIssue[],
    private readonly _baseUri: string = ''
  ) {
    super('By category', 'tag', vscode.TreeItemCollapsibleState.Collapsed)
  }

  public async getChildren(): Promise<BranchIssuesTreeNode[]> {
    const groups = groupBy(this._allIssues, ({ commitIssue: i }) => i.patternInfo.category)

    return Object.entries(groups)
      .sort(
        ([a], [b]) =>
          (CATEGORY_LEVEL_MAP[a as CodePatternCategory]?.order || 1000) -
          (CATEGORY_LEVEL_MAP[b as CodePatternCategory]?.order || 1000)
      )
      .map(([category, items]) => {
        const meta = CATEGORY_LEVEL_MAP[category as CodePatternCategory] || { label: category, icon: 'tag' }
        return new BranchIssuesTreeCategoryNode(meta.label, meta.icon, items, this._baseUri)
      })
  }
}

export class BranchIssuesTreeGroupBySeverityNode extends BranchIssuesTreeNode {
  constructor(
    private readonly _allIssues: BranchIssue[],
    private readonly _baseUri: string = ''
  ) {
    super('By severity', 'eye', vscode.TreeItemCollapsibleState.Collapsed)
  }

  public async getChildren(): Promise<BranchIssuesTreeNode[]> {
    const groups = groupBy(this._allIssues, ({ commitIssue: i }) => i.patternInfo.severityLevel)

    return Object.entries(groups)
      .sort(
        ([a], [b]) =>
          (SEVERITY_LEVEL_MAP[a as SeverityLevel]?.order || 1000) -
          (SEVERITY_LEVEL_MAP[b as SeverityLevel]?.order || 1000)
      )
      .map(([severity, items]) => {
        const meta = SEVERITY_LEVEL_MAP[severity as SeverityLevel]
        return new BranchIssuesTreeCategoryNode(meta.label, meta.icon, items, this._baseUri)
      })
  }
}
