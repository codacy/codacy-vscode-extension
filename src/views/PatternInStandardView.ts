// src/views/PatternInStandardView.ts
import * as vscode from 'vscode'
import { CodingStandardInfo, CommitIssue } from '../api/client'
import { Api } from '../api'

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

export async function showPatternInStandardView(
  params: { provider: string; organization: string },
  issue: CommitIssue,
  standards: CodingStandardInfo[]
) {
  const { data: pattern } = await Api.Tools.getPattern(issue.toolInfo.uuid, issue.patternInfo.id)

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
    `Disable pattern "${escapedTitle}"`,
    vscode.ViewColumn.Active,
    {
      enableScripts: true,
      localResourceRoots: [extensionUri],
    }
  )

  // Get the URI for the CSS file
  const styleUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'media', 'styles', 'pattern-in-standard.css')
  )

  // Get the URI for the JavaScript file
  const scriptUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'media', 'scripts', 'patternInStandardScript.js')
  )

  const styleEscapeHtml = escapeHtml(styleUri.toString())
  const scriptEscapeHtml = escapeHtml(scriptUri.toString())

  const standardsListHtml = standards
    .map((standard) => {
      const escapedName = escapeHtml(standard.name)
      const escapedId = escapeHtml(standard.id)
      const escapedProvider = escapeHtml(params.provider)
      const escapedOrganization = escapeHtml(params.organization)
      // All user-controlled values are escaped via escapeHtml() above
      const href =
        'https://app.codacy.com/organizations/' +
        escapedProvider +
        '/' +
        escapedOrganization +
        '/policies/coding-standards/edit?id=' +
        escapedId
      return '<li><a href="' + href + '" target="_blank">Edit "' + escapedName + '"</a></li>'
    })
    .join('')

  panel.webview.html = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleEscapeHtml}" rel="stylesheet">
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
          <button class="copy-pattern-button" data-pattern-title="${escapedTitle}">
            <svg xmlns="http://www.w3.org/2000/svg" class="copy-icon" width="16" height="16" viewBox="0 0 512 512"><rect x="128" y="128" width="336" height="336" rx="57" ry="57" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="32"/><path d="M383.5 128l.5-24a56.16 56.16 0 00-56-56H112a64.19 64.19 0 00-64 64v216a56.16 56.16 0 0056 56h24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/></svg>
            Copy pattern: "${escapedTitle}"
          </button>
        </div>
        <div class="step-card">
          <div class="step-header">
            <div class="step-number">2</div>
            <div class="step-title">Refresh your analysis</div>
          </div>
          <p class="step-description">After disabling the pattern, refresh your issues and local analysis rules.</p>
          <button class="refresh-button">Refresh issues</button>
        </div>
        <p class="help-text">
          Need help? <a href="https://docs.codacy.com/organizations/using-coding-standards/#editing" target="_blank">
            Learn how to disable patterns in standards
          </a>
        </p>
        <script src="${scriptEscapeHtml}"></script>
      </body>
    </html>`

  // Handle messages from the webview
  panel.webview.onDidReceiveMessage(
    async (message) => {
      switch (message.type) {
        case 'copyPattern':
          if (message.patternTitle) {
            await vscode.env.clipboard.writeText(message.patternTitle)
            vscode.window.showInformationMessage(`Pattern "${message.patternTitle}" copied to clipboard`)
          }
          return
        case 'refreshIssues':
          // TODO: Implement refresh issues
          return
      }
    },
    undefined,
    []
  )
}
