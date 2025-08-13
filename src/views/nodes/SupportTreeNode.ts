import * as vscode from 'vscode'

export class SupportTreeNode extends vscode.TreeItem {
  constructor(
    label: string,
    icon: string,
    public readonly url?: string,
    public readonly commandName?: string
  ) {
    super(label, vscode.TreeItemCollapsibleState.None)

    this.iconPath = new vscode.ThemeIcon(icon)

    if (url) {
      this.command = {
        command: 'vscode.open',
        title: 'Open',
        arguments: [vscode.Uri.parse(url)],
      }
    } else if (commandName) {
      this.command = {
        command: commandName,
        title: 'Open',
        arguments: [],
      }
    }
  }
}
