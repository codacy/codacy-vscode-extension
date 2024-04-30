import * as vscode from 'vscode'
import { LocalTool } from '../../local'



export class LocalToolsNode extends vscode.TreeItem {
  protected tool: LocalTool
  constructor(tool: LocalTool, collapsibleState?: vscode.TreeItemCollapsibleState) {
    super(tool.title, collapsibleState || vscode.TreeItemCollapsibleState.None)

    this.tool = tool
    this.setIconFromString(this.calculateIcon())
  }


  calculateIcon() {
    if (this.tool.installStatus) {
      return 'check'
    } else {
      return 'close'
    }
  }

  setIconFromString(icon? : string, colorId?: string) {
    this.iconPath = icon ? new vscode.ThemeIcon(icon, colorId ? new vscode.ThemeColor(colorId) : undefined) : undefined
  }

  get parent(): LocalToolsNode | undefined {
    return undefined
  }

  async getChildren(): Promise<LocalToolsNode[]> {
    return []
  }
}
