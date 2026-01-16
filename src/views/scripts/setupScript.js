//@ts-check
/// <reference lib="dom" />

/* global acquireVsCodeApi, document, window, console */

/**
 * @typedef {Object} VsCodeApi
 * @property {function(Object): void} postMessage
 * @property {function(): Object} getState
 * @property {function(Object): void} setState
 */

(function () {
  /** @type {VsCodeApi} */
  // @ts-expect-error - acquireVsCodeApi is provided by VS Code webview API
  const vscode = acquireVsCodeApi();

  // Track login state
  let isLoggedIn = false;

  // Request login status on load
  vscode.postMessage({ type: 'checkLoginStatus' });

  // Handle messages sent from the extension to the webview
  window.addEventListener('message', event => {
      // Validate origin - in VS Code webviews, origin is typically 'vscode-webview://' or the extension host
      if (event.origin && !event.origin.startsWith('vscode-webview://')) {
          return;
      }
      const message = event.data; // The json data that the extension sent
      if (!message || typeof message.type !== 'string') {
          return;
      }
      switch (message.type) {
          case 'loginStateChanged':
            isLoggedIn = message.isLoggedIn;
            handleLoginStateChange(isLoggedIn);
            break;
          default:
            break;
      }
  });

  /**
   * Handle login state changes
   * @param {boolean} loggedIn
   */
  function handleLoginStateChange(loggedIn) {
    const upgradeBox = document.getElementById('upgrade-box');
    if (!upgradeBox) return;
    if (loggedIn) {
      console.log('User is logged in');
      upgradeBox.style.display = 'none';
    } else {
      console.log('User is not logged in');
      upgradeBox.style.display = 'block';
    }
  }

}());