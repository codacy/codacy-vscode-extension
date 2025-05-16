import * as vscode from 'vscode'
import { CodacyCloud } from '../git/CodacyCloud'
import { PullRequestNode } from './nodes/PullRequestNode'
import { PullRequestSummaryNode } from './nodes'

type PullRequestTreeNodeType = PullRequestNode | PullRequestSummaryNode
export class PullRequestsTree extends vscode.Disposable implements vscode.TreeDataProvider<PullRequestTreeNodeType> {
  private _onDidChangeTreeData = new vscode.EventEmitter<PullRequestTreeNodeType | void>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event
  private _disposables: vscode.Disposable[] = []
  private _view: vscode.TreeView<PullRequestTreeNodeType>

  constructor(
    private _context: vscode.ExtensionContext,
    private _codacyCloud: CodacyCloud
  ) {
    super(() => this.dispose())

    // create the tree view
    this._view = vscode.window.createTreeView('codacy:pullRequests', {
      treeDataProvider: this,
      showCollapseAll: true,
    })

    this._context.subscriptions.push(this._view)

    // create a command to open the pull requests list
    this._context.subscriptions.push(
      vscode.commands.registerCommand('codacy.pullRequests.open', () => {
        this._view.reveal(this._view.selection[0])
      })
    )

    // subscribe to changes in the pull request
    this._codacyCloud.onDidUpdatePullRequests(() => {
      this._onDidChangeTreeData.fire()
    })
  }

  getTreeItem(element: PullRequestTreeNodeType): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element
  }

  async getChildren(element?: PullRequestTreeNodeType | undefined) {
    if (!element) {
      // root
      return this._codacyCloud.pullRequests.map((pr) => {
        return new PullRequestNode(pr)
      })
    } else {
      return await element.getChildren()
    }
  }

  getParent(element: PullRequestTreeNodeType): vscode.ProviderResult<PullRequestTreeNodeType> {
    return element.parent
  }

  dispose() {
    this._disposables.forEach((disposable) => disposable.dispose())
  }
}
