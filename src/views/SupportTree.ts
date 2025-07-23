import * as vscode from 'vscode'
import { SupportTreeNode } from './nodes/SupportTreeNode'

export class SupportTree extends vscode.Disposable implements vscode.TreeDataProvider<SupportTreeNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SupportTreeNode | void>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event
  private _view: vscode.TreeView<SupportTreeNode>

  constructor(private _context: vscode.ExtensionContext) {
    super(() => this.dispose())

    // create the tree view
    this._view = vscode.window.createTreeView('codacy:support', {
      treeDataProvider: this,
      showCollapseAll: false,
    })

    this._context.subscriptions.push(this._view)
  }

  getTreeItem(element: SupportTreeNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element
  }

  async getChildren(element?: SupportTreeNode | undefined): Promise<SupportTreeNode[]> {
    if (!element) {
      // root level - return all support items
      return [
        new SupportTreeNode(
          'Read documentation',
          'book',
          'https://docs.codacy.com/codacy-guardrails/codacy-guardrails-getting-started/'
        ),
        new SupportTreeNode('Contact support', 'mail', 'https://codacy.zendesk.com/hc/en-us/requests/new'),
        new SupportTreeNode('Give feedback', 'feedback', 'https://tally.so/r/meyROJ'),
        new SupportTreeNode(
          'Review extension',
          'star',
          'https://marketplace.visualstudio.com/items?itemName=codacy-app.codacy&ssr=false#review-details'
        ),
        new SupportTreeNode('View extension logs', 'output', undefined, 'codacy.showOutput'),
      ]
    } else {
      // these are leaf nodes, no children
      return []
    }
  }
}
