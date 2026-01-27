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

  const panel = vscode.window.createWebviewPanel(
    'codacy.patternInStandard', // internal id
    `Disable pattern "${escapedTitle}"`,
    vscode.ViewColumn.Active,
    { enableScripts: true }
  )

  const linksHtml = standards
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
        '/coding-standards/' +
        escapedId
      return '<li><a href="' + href + '" target="_blank">Edit "' + escapedName + '"</a></li>'
    })
    .join('')

  // linksHtml is constructed with escaped values, and toolPattern.patternDefinition.title is escaped
  panel.webview.html =
    '<!DOCTYPE html>\n' +
    '<html>\n' +
    '  <body style="font-family: system-ui, sans-serif; padding: 16px;">\n' +
    '    <h1>Disable pattern "' +
    escapedTitle +
    '"</h1>\n' +
    '    <p>\n' +
    '      Coding standards are shared across your organization. Changes may affect multiple\n' +
    '      repositories, so these changes must be made through the Codacy web app.\n' +
    '    </p>\n' +
    '\n' +
    '    <h2>1. Edit the standards</h2>\n' +
    '    <p>To disable this pattern, edit the standards below:</p>\n' +
    '    <ul>' +
    linksHtml +
    '</ul>\n' +
    '\n' +
    '    <h2>2. Refresh your analysis</h2>\n' +
    '    <p>After disabling the pattern, refresh your issues and local analysis rules.</p>\n' +
    '    <button onclick="vscode.postMessage({ type: \'refreshIssues\' })">Refresh issues</button>\n' +
    '\n' +
    '    <p style="margin-top: 24px; font-size: 12px;">\n' +
    '      Need help? <a href="https://docs.codacy.com/organizations/using-coding-standards/#editing" target="_blank">\n' +
    '        Learn how to disable patterns in standards\n' +
    '      </a>\n' +
    '    </p>\n' +
    '  </body>\n' +
    '</html>'
}
