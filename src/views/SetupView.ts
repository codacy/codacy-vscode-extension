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

    // Send initial login state to webview
    this.updateLoginState()

    // Listen for config changes to update login state
    Config.onDidConfigChange(() => {
      this.updateLoginState()
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
      }
    })
  }

  private async connectToCodacy() {
    await codacyAuth()
  }

  private async updateLoginState() {
    if (this._view) {
      const isLoggedIn = !!Config.apiToken
      const isOrgInCodacy = this._codacyCloud?.state !== CodacyCloudState.NeedsToAddOrganization
      const isRepoInCodacy = this._codacyCloud?.state !== CodacyCloudState.NeedsToAddRepository
      const userInfo = isLoggedIn ? await Account.current() : undefined
      const organizationInfo = this._codacyCloud?.organization
      const repositoryInfo = this._codacyCloud?.repository
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

  private async installMCP() {
    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Installing Codacy MCP...',
          cancellable: false,
        },
        async () => {
          await configureMCP(this._codacyCloud?.params)
        }
      )
      this.updateMCPStatus()
    } catch (error) {
      Logger.error(`Failed to install MCP: ${error instanceof Error ? error.message : 'Unknown error'}`)
      vscode.window.showErrorMessage(
        `Failed to install MCP: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private async installCLI() {
    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Installing Codacy CLI...',
          cancellable: false,
        },
        async () => {
          await this._codacyCloud?.cli?.install()
        }
      )
      this.updateCLIStatus()
      vscode.window.showInformationMessage('Codacy CLI installed successfully.')
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

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">

        <!--
          Use a content security policy to only allow loading styles from our extension directory,
          and only allow scripts that have a specific nonce.
          (See the 'webview-sample' extension sample for img-src content security policy examples)
        -->
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource}; script-src 'nonce-${nonce}'; img-src ${cspSource};">

        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <link href="${styleReset}" rel="stylesheet">
        <link href="${styleVSCode}" rel="stylesheet">
        <link href="${styleMain}" rel="stylesheet">

        <title>Cat Colors</title>
        <script nonce="${nonce}">
          window.iconUris = {
            finished: "${finishedStepIconUri}",
            unfinished: "${unfinishedStepIconUri}",
            warning: "${warningStepIconUri}"
          };
        </script>
        <script nonce="${nonce}" src="${script}"></script>
      </head>
      <body>
        <ul class="setup-list">
       <li> 
       <div class="setup-item flex" id="cloud-item">
          <img src="${unfinishedStepIconUri}" alt="Cloud Icon" class="setup-item-icon" id="cloud-icon">
          <div class="setup-item-content">
          <h2>Cloud sync </h2>
          <p id="cloud-description">Customize local analysis and keep your PRs up to standards in the IDE.</p>
            <a href="https://www.codacy.com/pricing" target="_blank"> 
              <button id="connect-to-codacy-button">Connect to Codacy</button> 
            </a>
            <p id="cloud-no-org-description" style="display: none;">Keep your project up to standards and customize rules.</p>
             <button id="add-org-button" style="display: none;">Add organization to Codacy</button>
             <button id="add-repo-button" style="display: none;">Add repository to Codacy</button>
          </div>
        </div>
        </li>

         <li> 
         <div class="setup-item flex" id="cli-item">
          <img src="${unfinishedStepIconUri}" alt="Cloud Icon" class="setup-item-icon" id="cli-icon">
          <div class="setup-item-content">
          <h2>Local analysis </h2>
          <p id="cli-description">Get instant feedback as you type by analyzing your code locally.</p>
          
              <button id="install-cli-button">Install Codacy CLI</button> 
              <p id="add-organization-section" style="display: none;">To customize the analysis, <button class="link-btn" id="add-organization-button">Add this organization to Codacy</button></p>
              <p id="add-repository-section" style="display: none;">To customize the analysis, <button class="link-btn" id="add-repository-button">Add this repository to Codacy</button></p>
            </div>
        </div>
        </li>

        <li> 
        <div class="setup-item flex" id="local-analysis-item">
         <img src="${unfinishedStepIconUri}" alt="Cloud Icon" class="setup-item-icon" id="mcp-icon">
          <div class="setup-item-content">
          <h2>AI Guardrails </h2>
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
