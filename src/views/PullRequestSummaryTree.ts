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

export class PullRequestSummaryTree
  extends vscode.Disposable
  implements vscode.TreeDataProvider<PullRequestSummaryNode>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<PullRequestSummaryNode | void>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event
  private _disposables: vscode.Disposable[] = []
  private _view: vscode.TreeView<PullRequestSummaryNode>

  constructor(
    private _context: vscode.ExtensionContext,
    private _codacyCloud: CodacyCloud
  ) {
    super(() => this.dispose())

    // create the tree view
    this._view = vscode.window.createTreeView('codacy:prSummary', {
      treeDataProvider: this,
      showCollapseAll: true,
    })

    this._context.subscriptions.push(this._view)

    // create a command to open the pull request summary
    this._context.subscriptions.push(
      vscode.commands.registerCommand('codacy.pr.openSummary', () => {
        this._view.reveal(this._view.selection[0])
      })
    )

    // subscribe to changes in the pull request
    this._codacyCloud.onDidUpdatePullRequest((pr) => {
      this._onDidChangeTreeData.fire()

      if (pr) {
        this._view.title = `Pull Request #${pr.meta.number}`
      } else {
        this._view.title = 'Pull Request'
      }
    })
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
