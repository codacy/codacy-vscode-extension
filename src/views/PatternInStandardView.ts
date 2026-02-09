import * as vscode from 'vscode'
import { CodingStandardInfo, Pattern } from '../api/client'
import { Api } from '../api'
import Logger from '../common/logger'
import { getNonce } from './utils'
import { CodacyCli } from '../cli/CodacyCli'
import { DisablePatternProps } from './IssueDetailsProvider'

/**
 * Escape HTML special characters to prevent XSS attacks
 */
function escapeHtml(text: string | number): string {
  const str = String(text)
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function showPatternInStandardView(
  props: DisablePatternProps,
  pattern: Pattern,
  standards: CodingStandardInfo[],
  cli?: CodacyCli
) {
  // Use a nonce to only allow a specific script to be run.
  const nonce = getNonce()

  const escapedTitle = escapeHtml(pattern.title || pattern.id)

  // Get extension URI for loading resources
  const extension = vscode.extensions.getExtension('codacy-app.codacy')
  if (!extension) {
    vscode.window.showErrorMessage('Unable to load extension resources')
    return
  }
  const extensionUri = extension.extensionUri

  const panel = vscode.window.createWebviewPanel(
    'codacy.patternInStandard', // internal id
    'Disable pattern',
    vscode.ViewColumn.Active,
    {
      enableScripts: true,
      localResourceRoots: [extensionUri],
    }
  )

  const styleUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'media', 'styles', 'pattern-in-standard.css')
  )
  const scriptUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'media', 'scripts', 'patternInStandardScript.js')
  )

  const standardsListHtml = standards
    .map((standard) => {
      const escapedName = escapeHtml(standard.name)
      const encodedId = encodeURIComponent(standard.id)
      const encodedProvider = encodeURIComponent(props.provider)
      const encodedOrganization = encodeURIComponent(props.organization)
      const href =
        'https://app.codacy.com/organizations/' +
        encodedProvider +
        '/' +
        encodedOrganization +
        '/policies/coding-standards/edit?id=' +
        encodedId
      return '<li><a href="' + href + '" target="_blank" rel="noopener noreferrer">Edit "' + escapedName + '"</a></li>'
    })
    .join('')

  const cspSource = escapeHtml(panel.webview.cspSource)
  const safeNonce = escapeHtml(nonce)

  panel.webview.html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <!--
          Use a content security policy to only allow loading styles from our extension directory,
          and only allow scripts that have a specific nonce.
          (See the 'webview-sample' extension sample for img-src content security policy examples)
        -->
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource}; script-src 'nonce-${safeNonce}'; img-src ${cspSource};">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleUri.toString()}" rel="stylesheet">
      </head>
      <body>
        <h1>Disable pattern "${escapedTitle}"</h1>
        <p class="intro-text">
          Coding standards are shared across your organization. Changes may affect multiple
          repositories, so these changes must be made through the Codacy web app.
        </p>
        <div class="step-card">
          <div class="step-header">
            <div class="step-number">1</div>
            <div class="step-title">Edit the standards</div>
          </div>
          <p class="step-description">To disable this pattern, edit the standards below:</p>
          <ul class="standards-list">${standardsListHtml}</ul>
          <button class="copy-pattern-button" data-pattern-title="${escapedTitle}" aria-label="Copy pattern">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" class="copy-icon" width="16" height="16" viewBox="0 0 512 512"><rect x="128" y="128" width="336" height="336" rx="57" ry="57" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="32"/><path d="M383.5 128l.5-24a56.16 56.16 0 00-56-56H112a64.19 64.19 0 00-64 64v216a56.16 56.16 0 0056 56h24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/></svg>
            Copy pattern: "${escapedTitle}"
          </button>
        </div>
        <div class="step-card">
          <div class="step-header">
            <div class="step-number">2</div>
            <div class="step-title">Refresh your analysis</div>
          </div>
          <p class="step-description">After disabling the pattern, refresh your issues and local analysis rules.</p>
          <button class="refresh-button" aria-label="Refresh issues">Refresh issues</button>
        </div>
        <p class="help-text">
          Need help? <a href="https://docs.codacy.com/organizations/using-coding-standards/#editing" target="_blank" rel="noopener noreferrer">
            Learn how to disable patterns in standards
          </a>
        </p>
        <script nonce="${safeNonce}" src="${scriptUri.toString()}"></script>
      </body>
    </html>`

  // Handle messages from the webview
  panel.webview.onDidReceiveMessage(
    async (message) => {
      switch (message.type) {
        case 'copyPattern':
          if (message.patternTitle) {
            try {
              await vscode.env.clipboard.writeText(message.patternTitle)
              vscode.window.showInformationMessage(`Pattern "${message.patternTitle}" copied to clipboard`)
            } catch (error) {
              vscode.window.showErrorMessage('Failed to copy pattern title to clipboard. Please try again.')
              Logger.error(
                `Failed to copy pattern title to clipboard: ${error instanceof Error ? error.message : 'Unknown error'}`
              )
            }
          }
          return
        case 'refreshIssues':
          try {
            if (!props.commitSHA) {
              Logger.debug(
                '[Codacy API] Attempted to refresh issues but no commit information was available for the selected issue.'
              )
            } else {
              await Api.Repository.reanalyzeCommitById(props.provider, props.organization, props.repository, {
                commitUuid: props.commitSHA,
              })
            }
            if (cli) {
              await cli.initialize()
            }
            if (cli || props.commitSHA) {
              vscode.window.showInformationMessage('Refresh started. This might take some time to reflect in the UI.')
            }
          } catch (error) {
            vscode.window.showErrorMessage('Failed to refresh issues. Please try again.')
            Logger.error(
              `[Codacy API] Failed to refresh issues from commit ${props.commitSHA}: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          }

          return
      }
    },
    undefined,
    []
  )
}
