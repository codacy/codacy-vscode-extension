import * as vscode from 'vscode'
import { CodacyCloud } from '../git/CodacyCloud'

export class StatusBar {
  private _disposables: vscode.Disposable[] = []
  private _statusBarItem: vscode.StatusBarItem
  private _isCliScanning: boolean = false

  constructor(
    private _context: vscode.ExtensionContext,
    private _codacyCloud: CodacyCloud
  ) {
    this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0)
    this._statusBarItem.command = 'codacy.pr.openSummary'
    this._statusBarItem.tooltip = 'Go to Codacy Pull Request summary'
    this._statusBarItem.text = '$(issue-draft) Codacy'
    this._statusBarItem.show()

    this._codacyCloud.onDidUpdatePullRequest(() => {
      this.update()
    })

    this._codacyCloud.onDidLoadRepository(() => {
      this.update()
    })

    this._codacyCloud.onDidChangeState(() => {
      this.update()
    })
  }

  public setCliScanning(isScanning: boolean) {
    this._isCliScanning = isScanning
    this.update()
  }

  private update() {
    // Show CLI scanning status if active
    if (this._isCliScanning) {
      this._statusBarItem.text = `$(loading~spin) Codacy: Scanning...`
      this._statusBarItem.color = new vscode.ThemeColor('statusBar.debuggingForeground')
      this._statusBarItem.backgroundColor = new vscode.ThemeColor('statusBar.debuggingBackground')
      this._statusBarItem.tooltip = 'Local analysis in progress'
      this._statusBarItem.show()
      return
    }

    const pr = this._codacyCloud.pullRequest?.analysis

    if (pr) {
      if (pr.isAnalysing) {
        this._statusBarItem.text = `$(loading~spin) Analyzing ...`
        this._statusBarItem.color = new vscode.ThemeColor('statusBar.debuggingForeground')
        this._statusBarItem.backgroundColor = new vscode.ThemeColor('statusBar.debuggingBackground')
      } else if (pr.isUpToStandards) {
        this._statusBarItem.text = `$(check) Codacy`
        this._statusBarItem.color = new vscode.ThemeColor('statusBar.foreground')
        this._statusBarItem.backgroundColor = new vscode.ThemeColor('statusBar.background')
        this._statusBarItem.tooltip = 'Up to standards'
      } else if (pr.isUpToStandards === false) {
        this._statusBarItem.text = `$(error) Codacy`
        this._statusBarItem.color = new vscode.ThemeColor('statusBarItem.errorForeground')
        this._statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground')
        this._statusBarItem.tooltip = 'Not up to standards'
      } else {
        this._statusBarItem.text = `$(circle-slash) Codacy`
        this._statusBarItem.tooltip = 'Not analysed'
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
