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
  protected toolsToShow: Array<LocalToolsToolNode> 
  protected localToolsDefs: Array<LocalTool>
  public runMode: string

  constructor(
    private _context: vscode.ExtensionContext,
    private _repositoryManager: RepositoryManager,
    private toolsList: Array<LocalTool>
  ) {
    super(() => this.dispose())
    this.runMode = "manual";

    this.localToolsDefs = toolsList
    this.toolsToShow = new Array<LocalToolsToolNode>()

    this.refresh()

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
    return this.toolsToShow
  }

  getParent(element: LocalToolsNode): vscode.ProviderResult<LocalToolsNode> {
    return element.parent
  }

  dispose() {
    this._disposables.forEach((disposable) => disposable.dispose())
  }

  refresh() {

    this.toolsToShow = new Array<LocalToolsToolNode>();

    const toolsMerged = new Map<string,LocalToolsToolNode>()

    for (let entry of this._repositoryManager.repoTools.entries()) {
      const key = entry[0];
          
      const tool = new LocalTool({
        title: key,
        cliCommand: '',
        cliExecute: '',
        cliVersion: '',
        cliInstallMacos: '',
        cliInstallApt: ''
      })
      tool.cloudEnabled = true
      tool.installStatus = false
          
      toolsMerged.set(tool.title, new LocalToolsToolNode(tool, this))

    }


    if (this.localToolsDefs)
      for (let i=0; i<this.localToolsDefs.length; i++){
        const tool = this.localToolsDefs[i];

        if (toolsMerged.has(tool.title)) {
          tool.cloudEnabled = true
        }
        toolsMerged.set(tool.title, new LocalToolsToolNode(tool, this))
      }
  

    
    for (let toolEntry of toolsMerged.entries()) {
      const toolValue = toolEntry[1];

      if (toolValue.tool.installStatus) {
        this.toolsToShow.push(toolValue)
      }
    }

    // this is super lazy, sorting by install status
    for (let toolEntry of toolsMerged.entries()) {
      let toolValue = toolEntry[1];

      if (!toolValue.tool.installStatus) {
        this.toolsToShow.push(toolValue)
      }
    }
    
    this.toolsToShow.forEach((tool) => {
      tool.calculateIcon()
    })
    // FIXME: this doesn't seem to do anything
    this._onDidChangeTreeData.fire();
  }
}
