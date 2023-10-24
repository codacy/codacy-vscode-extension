import * as vscode from 'vscode'
import { RepositoryManager } from '../git/RepositoryManager'
import { PullRequestInfo } from '../git/PullRequest'

export class PullRequestNode extends vscode.TreeItem {
  constructor(pr: PullRequestInfo) {
    super(pr.analysis.pullRequest.title, vscode.TreeItemCollapsibleState.None)

    this.iconPath = new vscode.ThemeIcon(
      pr.analysis.isUpToStandards ? 'pass' : 'error',
      new vscode.ThemeColor(pr.analysis.isUpToStandards ? 'testing.iconPassed' : 'testing.iconFailed')
    )
    this.contextValue = 'pullRequest'
    this.description = `#${pr.analysis.pullRequest.number.toString()}`

    this.tooltip = pr.status.message
  }

  get parent(): PullRequestNode | undefined {
    return undefined
  }

  async getChildren(): Promise<PullRequestNode[]> {
    return []
  }
}

export class PullRequestsTree extends vscode.Disposable implements vscode.TreeDataProvider<PullRequestNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<PullRequestNode | void>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event
  private _disposables: vscode.Disposable[] = []
  private _view: vscode.TreeView<PullRequestNode>

  constructor(
    private _context: vscode.ExtensionContext,
    private _repositoryManager: RepositoryManager
  ) {
    super(() => this.dispose())

    // create the tree view
    this._view = vscode.window.createTreeView('codacy:pullRequests', {
      treeDataProvider: this,
      showCollapseAll: false,
    })

    this._context.subscriptions.push(this._view)

    // create a command to open the pull requests list
    this._context.subscriptions.push(
      vscode.commands.registerCommand('codacy.pullRequests.open', () => {
        this._view.reveal(this._view.selection[0])
      })
    )

    // subscribe to changes in the pull request
    this._repositoryManager.onDidLoadRepository(() => {
      // this._repositoryManager.onDidUpdatePullRequest((pr) => {
      this._onDidChangeTreeData.fire()

      // if (pr) {
      //   this._view.title = `Pull Request #${pr.meta.number}`
      // } else {
      //   this._view.title = 'Pull Request'
      // }
    })
  }

  getTreeItem(element: PullRequestNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element
  }

  async getChildren(element?: PullRequestNode | undefined) {
    if (!element) {
      // root
      return this._repositoryManager.pullRequests.map((pr) => {
        return new PullRequestNode(pr)
      })
    } else {
      return await element.getChildren()
    }
  }

  getParent(element: PullRequestNode): vscode.ProviderResult<PullRequestNode> {
    return element.parent
  }

  dispose() {
    this._disposables.forEach((disposable) => disposable.dispose())
  }
}
