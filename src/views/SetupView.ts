import * as vscode from 'vscode'
import { Config } from '../common/config'
import { configureMCP, isMCPConfigured } from '../commands/configureMCP'
import { checkRulesFile, createOrUpdateRules } from '../commands/createRules'
import { Cli } from '../cli'
import { CodacyCloud, CodacyCloudState } from '../git/CodacyCloud'
import { addRepository } from '../onboarding'
import { codacyAuth } from '../auth'
import Logger from '../common/logger'
import { Account } from '../codacy/Account'

function getNonce() {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

export const activateWebview = (context: vscode.ExtensionContext, codacyCloud?: CodacyCloud) => {
  const provider = new SetupViewProvider(context.extensionUri, codacyCloud)

  context.subscriptions.push(vscode.window.registerWebviewViewProvider(SetupViewProvider.viewType, provider))

  return provider
}

export class SetupViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'codacy.setupView'

  private _view?: vscode.WebviewView
  private _codacyCloud?: CodacyCloud

  // Track setup completion status
  private _isCloudComplete = false
  private _isCLIComplete = false
  private _isMCPComplete = false

  private static readonly TOTAL_SETUP_ITEMS = 3

  constructor(
    private readonly _extensionUri: vscode.Uri,
    codacyCloud?: CodacyCloud
  ) {
    this._codacyCloud = codacyCloud
  }

  public setCodacyCloud(codacyCloud: CodacyCloud) {
    this._codacyCloud = codacyCloud
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    }

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview)

    // Send initial status to webview and update badge
    this.updateLoginState()
    this.updateMCPStatus()
    this.updateCLIStatus()

    // Track disposables for cleanup
    const disposables: vscode.Disposable[] = []

    // Listen for config changes to update login state
    disposables.push(
      Config.onDidConfigChange(() => {
        this.updateLoginState()
      })
    )

    // Listen for CodacyCloud state changes to update login state
    if (this._codacyCloud) {
      disposables.push(
        this._codacyCloud.onDidChangeState(() => {
          this.updateLoginState()
          this.updateCLIStatus()
        })
      )
    }

    // Clean up listeners when webview is disposed
    webviewView.onDidDispose(() => {
      disposables.forEach((d) => d.dispose())
    })

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.type) {
        case 'checkLoginStatus':
          this.updateLoginState()
          break
        case 'checkMCPStatus':
          this.updateMCPStatus()
          break
        case 'checkCLIStatus':
          this.updateCLIStatus()
          break
        case 'connectToCodacy':
          this.connectToCodacy()
          break
        case 'generateInstructionsFile':
          this.generateInstructionsFile()
          break
        case 'addOrganization':
          this.connectToCodacy()
          break
        case 'addRepository':
          this.addRepository()
          break
        case 'installMCP':
          this.installMCP()
          break
        case 'installCLI':
          this.installCLI()
          break
        case 'openMCPSettings':
          vscode.commands.executeCommand('workbench.action.openSettings', 'codacy')
          break
        case 'refreshMCPStatus':
          this.installMCP()
          break
        case 'refreshCLIStatus':
          this.updateCLIStatus()
          break
        case 'openCLISettings':
          vscode.commands.executeCommand('workbench.action.openSettings', 'codacy.cli')
          break
      }
    })
  }

  private async connectToCodacy() {
    await codacyAuth()
  }

  private updateBadge() {
    if (!this._view) return

    const completedCount = [this._isCloudComplete, this._isCLIComplete, this._isMCPComplete].filter(Boolean).length
    const pendingCount = SetupViewProvider.TOTAL_SETUP_ITEMS - completedCount

    if (pendingCount > 0) {
      this._view.title = `SETUP (${pendingCount} left)`
    } else {
      this._view.title = 'SETUP'
    }
  }

  private async updateLoginState() {
    if (this._view) {
      const isLoggedIn = !!Config.apiToken
      const isOrgInCodacy = this._codacyCloud?.state !== CodacyCloudState.NeedsToAddOrganization
      const isRepoInCodacy = this._codacyCloud?.state !== CodacyCloudState.NeedsToAddRepository
      const userInfo = isLoggedIn ? await Account.current() : undefined
      const organizationInfo = this._codacyCloud?.organization
      const repositoryInfo = this._codacyCloud?.repository

      // Cloud is complete when logged in with org and repo in Codacy
      this._isCloudComplete = isLoggedIn && isOrgInCodacy && isRepoInCodacy
      this.updateBadge()

      this._view.webview.postMessage({
        type: 'loginStateChanged',
        isLoggedIn,
        isOrgInCodacy,
        isRepoInCodacy,
        userInfo,
        organizationInfo,
        repositoryInfo,
      })
    }
  }

  private updateMCPStatus() {
    if (this._view) {
      const isMCPInstalled = isMCPConfigured()
      checkRulesFile().then((hasInstructionFile) => {
        // MCP is complete when installed and has instructions file
        this._isMCPComplete = isMCPInstalled && hasInstructionFile
        this.updateBadge()

        this._view?.webview.postMessage({
          type: 'mcpStatusChanged',
          isMCPInstalled,
          hasInstructionFile,
        })
      })
    }
  }

  private updateCLIStatus() {
    if (this._view) {
      const isCLIInstalled = !!Cli.cliInstance?.getCliCommand()
      const isOrgInCodacy = this._codacyCloud?.state !== CodacyCloudState.NeedsToAddOrganization
      const isRepoInCodacy = this._codacyCloud?.state !== CodacyCloudState.NeedsToAddRepository

      // CLI is complete when installed
      this._isCLIComplete = isCLIInstalled
      this.updateBadge()

      this._view.webview.postMessage({
        type: 'cliStatusChanged',
        isCLIInstalled,
        isOrgInCodacy,
        isRepoInCodacy,
      })
    }
  }

  private generateInstructionsFile() {
    createOrUpdateRules().then(() => {
      this.updateMCPStatus()
    })
  }

  private async addRepository() {
    if (!this._codacyCloud) {
      vscode.window.showErrorMessage('No repository context available.')
      return
    }

    if (!this._codacyCloud.params) {
      vscode.window.showErrorMessage('Repository parameters not found. Please ensure you have a valid git remote.')
      return
    }

    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Adding repository to Codacy...',
          cancellable: false,
        },
        async () => {
          await addRepository(this._codacyCloud!)
        }
      )
      // Refresh state after adding repository
      this._codacyCloud.refresh()
      this.updateLoginState()
    } catch (error) {
      Logger.error(`Failed to add repository: ${error instanceof Error ? error.message : 'Unknown error'}`)
      vscode.window.showErrorMessage(
        `Failed to add repository: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private async installMCP(isUpdate = false) {
    try {
      await configureMCP(this._codacyCloud?.params, isUpdate)
      this.updateMCPStatus()
    } catch (error) {
      Logger.error(`Failed to configure MCP: ${error instanceof Error ? error.message : 'Unknown error'}`)
      vscode.window.showErrorMessage(
        `Failed to configure MCP: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private async installCLI() {
    try {
      await this._codacyCloud?.cli?.install()
      this.updateCLIStatus()
    } catch (error) {
      Logger.error(`Failed to install CLI: ${error instanceof Error ? error.message : 'Unknown error'}`)
      vscode.window.showErrorMessage(
        `Failed to install CLI: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'src', 'views', 'scripts', 'setupScript.js')
    )

    // Do the same for the stylesheet.
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'src', 'views', 'styles', 'reset.css')
    )
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'src', 'views', 'styles', 'vscode.css')
    )
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'src', 'views', 'styles', 'main.css')
    )

    const unfinishedStepIconUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'src', 'views', 'assets', 'circle-large.svg')
    )

    const finishedStepIconUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'src', 'views', 'assets', 'pass-filled.svg')
    )
    const warningStepIconUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'src', 'views', 'assets', 'warning.svg')
    )

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce()

    // Helper function to escape HTML entities
    function escapeHtml(str: unknown) {
      if (typeof str !== 'string') return str
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    }

    // Escape all interpolated variables
    const cspSource = escapeHtml(webview.cspSource)
    const styleReset = escapeHtml(styleResetUri.toString())
    const styleVSCode = escapeHtml(styleVSCodeUri.toString())
    const styleMain = escapeHtml(styleMainUri.toString())
    const script = escapeHtml(scriptUri.toString())
    const safeNonce = escapeHtml(nonce)

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <!--
    Use a content security policy to only allow loading styles from our extension directory,
    and only allow scripts that have a specific nonce.
    (See the 'webview-sample' extension sample for img-src content security policy examples)
  -->
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource}; script-src 'nonce-${safeNonce}'; img-src ${cspSource};">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <link href="${styleReset}" rel="stylesheet">
  <link href="${styleVSCode}" rel="stylesheet">
  <link href="${styleMain}" rel="stylesheet">

  <title>Codacy Setup</title>
  <script nonce="${safeNonce}">
    window.iconUris = {
      finished: "${finishedStepIconUri}",
      unfinished: "${unfinishedStepIconUri}",
      warning: "${warningStepIconUri}"
    };
  </script>
  <script nonce="${safeNonce}" src="${script}"></script>
</head>
<body>
  <ul class="setup-list">
    <li>
      <div class="setup-item flex" id="cloud-item">
        <img src="${unfinishedStepIconUri}" alt="Cloud Icon" class="setup-item-icon" id="cloud-icon">
        <div class="setup-item-content">
          <h2>Cloud sync</h2>
          <p id="cloud-description">Customize local analysis and keep your PRs up to standards in the IDE.</p>
          <button id="connect-to-codacy-button">Connect to Codacy</button>
          <p id="cloud-no-org-description" style="display: none;">Keep your project up to standards and customize rules.</p>
          <button id="add-org-button" style="display: none;">Add organization to Codacy</button>
          <button id="add-repo-button" style="display: none;">Add repository to Codacy</button>
        </div>
      </div>
    </li>

    <li>
      <div class="setup-item flex" id="cli-item">
        <img src="${unfinishedStepIconUri}" alt="CLI Icon" class="setup-item-icon" id="cli-icon">
        <div class="setup-item-content">
          <div class="setup-item-header">
            <h2>Local analysis</h2>
            <div class="header-actions" id="cli-header-actions">
              <button class="icon-btn" id="cli-refresh-button" title="Refresh status">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.681 3H2V2h3.5l.5.5V6H5V4a5 5 0 1 0 4.53-.761l.302-.954A6 6 0 1 1 4.681 3z"/></svg>
              </button>
              <button class="icon-btn" id="cli-settings-button" title="Open settings">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M9.1 4.4L8.6 2H7.4l-.5 2.4-.7.3-2-1.3-.9.8 1.3 2-.2.7-2.4.5v1.2l2.4.5.3.8-1.3 2 .8.8 2-1.3.8.3.4 2.3h1.2l.5-2.4.8-.3 2 1.3.8-.8-1.3-2 .3-.8 2.3-.4V7.4l-2.4-.5-.3-.8 1.3-2-.8-.8-2 1.3-.7-.2zM9.4 1l.5 2.4L12 2.1l2 2-1.4 2.1 2.4.4v2.8l-2.4.5L14 12l-2 2-2.1-1.4-.5 2.4H6.6l-.5-2.4L4 14l-2-2 1.4-2.1L1 9.4V6.6l2.4-.5L2 4l2-2 2.1 1.4.4-2.4h3zm.6 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm1 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/></svg>
              </button>
            </div>
          </div>
          <p id="cli-description">Get instant feedback as you type by analyzing your code locally.</p>
          <button id="install-cli-button">Install Codacy CLI</button>
          <p id="add-organization-section" style="display: none;">To customize the analysis, <button class="link-btn" id="add-organization-button">Add this organization to Codacy</button></p>
          <p id="add-repository-section" style="display: none;">To customize the analysis, <button class="link-btn" id="add-repository-button">Add this repository to Codacy</button></p>
        </div>
      </div>
    </li>

    <li>
      <div class="setup-item flex" id="local-analysis-item">
        <img src="${unfinishedStepIconUri}" alt="MCP Icon" class="setup-item-icon" id="mcp-icon">
        <div class="setup-item-content">
          <div class="setup-item-header">
            <h2>AI Guardrails</h2>
            <div class="header-actions" id="mcp-header-actions">
              <button class="icon-btn" id="mcp-refresh-button" title="Refresh status">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.681 3H2V2h3.5l.5.5V6H5V4a5 5 0 1 0 4.53-.761l.302-.954A6 6 0 1 1 4.681 3z"/></svg>
              </button>
              <button class="icon-btn" id="mcp-settings-button" title="Open settings">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M9.1 4.4L8.6 2H7.4l-.5 2.4-.7.3-2-1.3-.9.8 1.3 2-.2.7-2.4.5v1.2l2.4.5.3.8-1.3 2 .8.8 2-1.3.8.3.4 2.3h1.2l.5-2.4.8-.3 2 1.3.8-.8-1.3-2 .3-.8 2.3-.4V7.4l-2.4-.5-.3-.8 1.3-2-.8-.8-2 1.3-.7-.2zM9.4 1l.5 2.4L12 2.1l2 2-1.4 2.1 2.4.4v2.8l-2.4.5L14 12l-2 2-2.1-1.4-.5 2.4H6.6l-.5-2.4L4 14l-2-2 1.4-2.1L1 9.4V6.6l2.4-.5L2 4l2-2 2.1 1.4.4-2.4h3zm.6 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm1 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/></svg>
              </button>
            </div>
          </div>
          <p id="mcp-description">Control your AI generated code with Codacy Guardrails.</p>
          <button id="install-mcp-button">Install Codacy MCP</button>
          <button class="link-btn" id="generate-instructions-button" style="display: none;">Generate Instructions File</button>
        </div>
      </div>
    </li>
  </ul>

  <div class="setup-item upgrade-box" id="upgrade-box">
    <p>Strengthen security and quality across all your repositories.</p>
    <a href="https://www.codacy.com/pricing" target="_blank">
      <button class="secondary">Upgrade to PRO</button>
    </a>
  </div>
</body>
</html>`
  }
}
