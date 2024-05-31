import * as vscode from 'vscode'
import { LocalToolsNode } from './LocalToolsNode'
import { LocalToolsTree } from '../LocalToolsTree'
import { LocalTool } from '../../local';

export class LocalToolsToolInfoNode extends LocalToolsNode {
  constructor(tool : LocalTool) {
    super(
      tool,
      vscode.TreeItemCollapsibleState.None
    )
  }
}



export class LocalToolsToolNode extends LocalToolsToolInfoNode {
  constructor(tool : LocalTool, private readonly _toolsView: LocalToolsTree) {

    super(tool)
    this._toolsView = _toolsView

    // use this to highlight runnable-ness? install status...? etc
    //this.contextValue = "toggleCoverageOn"

    this.collapsibleState = vscode.TreeItemCollapsibleState.None
  }

  async getChildren(element?: LocalToolsNode | undefined) {
    return []
  }

}
