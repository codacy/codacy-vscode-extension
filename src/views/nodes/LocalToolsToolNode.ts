import * as vscode from 'vscode'
import { LocalToolsNode } from './LocalToolsNode'
import { LocalToolsTree } from '../LocalToolsTree'

export class LocalToolsToolInfoNode extends LocalToolsNode {
  constructor(label : string, cmdline : string, icon : string) {
    const messages = Array<string>();


    super(
      label,
      icon,
      vscode.TreeItemCollapsibleState.None,
      undefined
    )
  }
}

export class LocalToolsToolNode extends LocalToolsToolInfoNode {
  constructor(label : string, cmdline : string, private readonly _toolsView: LocalToolsTree) {
    var icon = 'close'
    var commandExistsSync = require('command-exists').sync;

    if (commandExistsSync(cmdline)) {
      icon = 'check'
      // fixme, check installed version vs codacy version
    }

    super(label, cmdline, icon)
    this._toolsView = _toolsView

    // use this to highlight runnable-ness? install status...? etc
    //this.contextValue = "toggleCoverageOn"

    this.collapsibleState = vscode.TreeItemCollapsibleState.None
  }

  async getChildren(element?: LocalToolsNode | undefined) {
    return []
  }

}
