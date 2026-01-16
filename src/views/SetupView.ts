import * as vscode from 'vscode'
import { Config } from '../common/config'

function getNonce() {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

export const activateWebview = (context: vscode.ExtensionContext) => {
  const provider = new SetupViewProvider(context.extensionUri)

  context.subscriptions.push(vscode.window.registerWebviewViewProvider(SetupViewProvider.viewType, provider))
}

class SetupViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'codacy.setupView'

  private _view?: vscode.WebviewView
  constructor(private readonly _extensionUri: vscode.Uri) {}

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
      }
    })
  }

  private updateLoginState() {
    if (this._view) {
      const isLoggedIn = !!Config.apiToken
      this._view.webview.postMessage({
        type: 'loginStateChanged',
        isLoggedIn,
      })
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
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource}; script-src 'nonce-${nonce}';">

        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <link href="${styleReset}" rel="stylesheet">
        <link href="${styleVSCode}" rel="stylesheet">
        <link href="${styleMain}" rel="stylesheet">

        <title>Cat Colors</title>
        <script nonce="${nonce}" src="${script}"></script>
      </head>
      <body>
        <ul class="setup-list">
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
