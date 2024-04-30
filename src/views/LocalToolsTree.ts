import * as vscode from 'vscode'
import { RepositoryManager } from '../git/RepositoryManager'
import {
  LocalToolsNode
} from './nodes'
import { LocalToolsToolNode } from './nodes/LocalToolsToolNode'
import { LocalTool } from '../local'

export class LocalToolsTree
  extends vscode.Disposable
  implements vscode.TreeDataProvider<LocalToolsNode>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<LocalToolsNode | void>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event
  private _disposables: vscode.Disposable[] = []
  private _view: vscode.TreeView<LocalToolsNode>
  protected tools: Array<LocalToolsToolNode> 
  public runMode: string

  constructor(
    private _context: vscode.ExtensionContext,
    private _repositoryManager: RepositoryManager,
    private toolsList: Array<LocalTool>
  ) {
    super(() => this.dispose())
    this.runMode = "manual";

    this.tools = new Array<LocalToolsToolNode>();
    if (toolsList)
    for (let i=0; i<toolsList.length; i++){
      let tool = toolsList[i];
      this.tools.push(new LocalToolsToolNode(tool, this));
    }

    // create the tree view
    this._view = vscode.window.createTreeView('codacy:localTools', {
      treeDataProvider: this,
      showCollapseAll: true,
    })

    this._context.subscriptions.push(this._view)

    // create a command to open the pull request summary
    this._context.subscriptions.push(
      vscode.commands.registerCommand('codacy.local.openTools', () => {
        this._view.reveal(this._view.selection[0])
      })
    )

  }

  getTreeItem(element: LocalToolsNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element
  }

  async getChildren(element?: LocalToolsNode | undefined) {
    return this.tools
  }

  getParent(element: LocalToolsNode): vscode.ProviderResult<LocalToolsNode> {
    return element.parent
  }

  dispose() {
    this._disposables.forEach((disposable) => disposable.dispose())
  }

  refresh() {
    this.tools.forEach((tool) => {
      tool.calculateIcon()
    })
    // FIXME: this doesn't seem to do anything
    this._onDidChangeTreeData.fire();
  }
}
