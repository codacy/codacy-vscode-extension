import * as vscode from 'vscode'
import { RepositoryManager } from '../git/RepositoryManager'

export class StatusBar {
  private _disposables: vscode.Disposable[] = []
  private _statusBarItem: vscode.StatusBarItem

  constructor(
    private _context: vscode.ExtensionContext,
    private _repositoryManager: RepositoryManager
  ) {
    this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0)
    this._statusBarItem.command = 'pr.openSummary'
    this._statusBarItem.tooltip = 'Go to Codacy Pull Request summary'
    this._statusBarItem.text = '$(issue-draft) Codacy'
    this._statusBarItem.show()

    this._repositoryManager.onDidUpdatePullRequest(() => {
      this.update()
    })
  }

  private update() {
    const pr = this._repositoryManager.pullRequest
    if (pr) {
      if (pr.isAnalysing) {
        this._statusBarItem.text = `$(sync~spin) Analysing ...`
        this._statusBarItem.color = new vscode.ThemeColor('statusBar.debuggingForeground')
        this._statusBarItem.backgroundColor = new vscode.ThemeColor('statusBar.debuggingBackground')
      } else if (pr.isUpToStandards) {
        this._statusBarItem.text = `$(check) Codacy`
        this._statusBarItem.color = new vscode.ThemeColor('statusBar.foreground')
        this._statusBarItem.backgroundColor = new vscode.ThemeColor('statusBar.background')
        this._statusBarItem.tooltip = 'Up to standards'
      } else {
        this._statusBarItem.text = `$(error) Codacy`
        this._statusBarItem.color = new vscode.ThemeColor('statusBarItem.errorForeground')
        this._statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground')
        this._statusBarItem.tooltip = 'Not up to standards'
      }

      this._statusBarItem.show()
    } else {
      this._statusBarItem.hide()
    }
  }

  dispose() {
    this._disposables.forEach((disposable) => disposable.dispose())
  }
}
