import * as vscode from 'vscode'
import { LocalTool } from '../../local'



export class LocalToolsNode extends vscode.TreeItem {
  public tool: LocalTool
  constructor(tool: LocalTool, collapsibleState?: vscode.TreeItemCollapsibleState) {
    super(tool.title, collapsibleState || vscode.TreeItemCollapsibleState.None)

    this.tool = tool
    this.setIconFromString(this.calculateIcon())
  }


  calculateIcon() {
    // cliCommand is a proxy for it being available as a local tool
    if (!this.tool.installStatus && this.tool.cliCommand && this.tool.cloudEnabled) {
      return 'desktop-download'
    }

    if (this.tool.cloudEnabled && !this.tool.installStatus) {
      return 'cloud'
    }

    if (this.tool.installStatus) {
      return 'run-coverage'
    } else {
      return 'desktop-download'
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
