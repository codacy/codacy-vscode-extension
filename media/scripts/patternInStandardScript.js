//@ts-check
/// <reference lib="dom" />

/* global acquireVsCodeApi, document */

/**
 * @typedef {Object} VsCodeApi
 * @property {function(Object): void} postMessage
 * @property {function(): Object} getState
 * @property {function(Object): void} setState
 */

;(function () {
  /** @type {VsCodeApi} */
  // @ts-expect-error - acquireVsCodeApi is provided by VS Code webview API
  const vscode = acquireVsCodeApi()

  document.addEventListener('DOMContentLoaded', function () {
    const copyPatternButton = document.querySelector('.copy-pattern-button')
    if (copyPatternButton) {
      copyPatternButton.addEventListener('click', function () {
        const patternTitle = this.getAttribute('data-pattern-title')
        if (patternTitle) {
          vscode.postMessage({ type: 'copyPattern', patternTitle: patternTitle })
        }
      })
    }

    const refreshButton = document.querySelector('.refresh-button')
    if (refreshButton) {
      refreshButton.addEventListener('click', function () {
        vscode.postMessage({ type: 'refreshIssues' })
      })
    }
  })
})()
