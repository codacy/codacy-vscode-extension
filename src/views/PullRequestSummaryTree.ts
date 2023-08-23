import * as vscode from 'vscode'
import { RepositoryManager } from '../git/RepositoryManager'
import {
  PullRequestComplexityNode,
  PullRequestCoverageNode,
  PullRequestDuplicationNode,
  PullRequestInformationNode,
  PullRequestIssuesNode,
  PullRequestSummaryNode,
} from './nodes/PullRequestSummaryNodes'

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
    private _repositoryManager: RepositoryManager
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
      vscode.commands.registerCommand('pr.openSummary', () => {
        this._view.reveal(this._view.selection[0])
      })
    )

    // subscribe to changes in the pull request
    this._repositoryManager.onDidUpdatePullRequest((pr) => {
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
      if (this._repositoryManager.pullRequest?.analysis) {
        return [
          new PullRequestInformationNode(this._repositoryManager.pullRequest),
          new PullRequestIssuesNode(this._repositoryManager.pullRequest),
          new PullRequestCoverageNode(this._repositoryManager.pullRequest),
          new PullRequestDuplicationNode(this._repositoryManager.pullRequest),
          new PullRequestComplexityNode(this._repositoryManager.pullRequest),
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
}
