import * as vscode from 'vscode'
import { CodacyCloud } from '../git/CodacyCloud'
import {
  PullRequestComplexityNode,
  PullRequestCoverageNode,
  PullRequestDuplicationNode,
  PullRequestInformationNode,
  PullRequestIssuesNode,
  PullRequestSummaryNode,
} from './nodes'
import Logger from '../common/logger'

export class PullRequestSummaryTree
  extends vscode.Disposable
  implements vscode.TreeDataProvider<PullRequestSummaryNode>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<PullRequestSummaryNode | void>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event
  private _disposables: vscode.Disposable[] = []
  private _view: vscode.TreeView<PullRequestSummaryNode> | undefined

  constructor(
    private _context: vscode.ExtensionContext,
    private _codacyCloud: CodacyCloud
  ) {
    super(() => this.dispose())

    // create the tree view
    try {
      this._view = vscode.window.createTreeView('codacy:prSummary', {
        treeDataProvider: this,
        showCollapseAll: true,
      })

      this._context.subscriptions.push(this._view)
      Logger.debug('PullRequestView created successfully')

      // create a command to open the pull request summary
      this._context.subscriptions.push(
        vscode.commands.registerCommand('codacy.pr.openSummary', () => {
          if (this._view) {
            this._view.reveal(this._view.selection[0])
          }
        })
      )

      // subscribe to changes in the pull request
      this._codacyCloud.onDidUpdatePullRequest((pr) => {
        this._onDidChangeTreeData.fire()

        if (this._view) {
          if (pr) {
            this._view.title = `Pull Request #${pr.meta.number}`
          } else {
            this._view.title = 'Pull Request'
          }
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      Logger.error(`Failed to create PullRequestView: ${errorMessage}`)
      Logger.error(
        `[PullRequestView] Error stack: ${error instanceof Error ? error.stack : '[PullRequestView] No stack trace'}`
      )
      this._view = undefined
      // Don't re-throw - let extension continue even if this view fails
    }
  }

  getTreeItem(element: PullRequestSummaryNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element
  }

  async getChildren(element?: PullRequestSummaryNode | undefined) {
    if (!element) {
      if (this._codacyCloud.pullRequest?.analysis) {
        return [
          new PullRequestInformationNode(this._codacyCloud.pullRequest),
          new PullRequestIssuesNode(this._codacyCloud.pullRequest),
          new PullRequestCoverageNode(this._codacyCloud.pullRequest),
          new PullRequestDuplicationNode(this._codacyCloud.pullRequest),
          new PullRequestComplexityNode(this._codacyCloud.pullRequest),
        ]
      } else return []
    } else {
      return await element.getChildren()
    }
  }

  getParent(element: PullRequestSummaryNode): vscode.ProviderResult<PullRequestSummaryNode> {
    return element.parent
  }

  dispose() {
    this._disposables.forEach((disposable) => disposable.dispose())
  }

  refresh() {
    this._onDidChangeTreeData.fire()
  }
}
