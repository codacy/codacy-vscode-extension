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
    this._repositoryManager.onDidUpdatePullRequest(() => {
      this._onDidChangeTreeData.fire()

      if (this._repositoryManager.pullRequest) {
        this._view.title = `Pull Request #${this._repositoryManager.pullRequest.meta.number}`
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
      const pr = this._repositoryManager.pullRequest?.analysis
      if (pr) {
        return [
          new PullRequestInformationNode(pr),
          new PullRequestIssuesNode(pr),
          new PullRequestCoverageNode(pr),
          new PullRequestDuplicationNode(pr),
          new PullRequestComplexityNode(pr),
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
