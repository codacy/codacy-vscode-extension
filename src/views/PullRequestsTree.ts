import * as vscode from 'vscode'
import { CodacyCloud } from '../git/CodacyCloud'
import { PullRequestNode } from './nodes/PullRequestNode'
import { PullRequestSummaryNode } from './nodes'
import Logger from '../common/logger'

type PullRequestTreeNodeType = PullRequestNode | PullRequestSummaryNode
export class PullRequestsTree extends vscode.Disposable implements vscode.TreeDataProvider<PullRequestTreeNodeType> {
  private _onDidChangeTreeData = new vscode.EventEmitter<PullRequestTreeNodeType | void>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event
  private _disposables: vscode.Disposable[] = []
  private _view: vscode.TreeView<PullRequestTreeNodeType> | undefined

  constructor(
    private _context: vscode.ExtensionContext,
    private _codacyCloud: CodacyCloud
  ) {
    super(() => this.dispose())

    // create the tree view
    try {
      this._view = vscode.window.createTreeView('codacy:pullRequests', {
        treeDataProvider: this,
        showCollapseAll: true,
      })

      this._context.subscriptions.push(this._view)
      Logger.debug('OpenPullRequestsView created successfully')

      // create a command to open the pull requests list
      this._context.subscriptions.push(
        vscode.commands.registerCommand('codacy.pullRequests.open', () => {
          if (this._view) {
            this._view.reveal(this._view.selection[0])
          }
        })
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      Logger.error(`Failed to create OpenPullRequestsView: ${errorMessage}`)
      Logger.error(
        `[OpenPullRequestsView] Error stack: ${error instanceof Error ? error.stack : '[OpenPullRequestsView] No stack trace'}`
      )
      this._view = undefined
      // Don't re-throw - let extension continue even if this view fails
    }

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
