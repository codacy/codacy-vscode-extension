//@ts-check
/// <reference lib="dom" />

/* global acquireVsCodeApi, document, window */

/**
 * @typedef {Object} VsCodeApi
 * @property {function(Object): void} postMessage
 * @property {function(): Object} getState
 * @property {function(Object): void} setState
 */

/**
 * @typedef {Object} IconUris
 * @property {string} finished
 * @property {string} unfinished
 * @property {string} warning
 */

; (function () {
  /** @type {VsCodeApi} */
  // @ts-expect-error - acquireVsCodeApi is provided by VS Code webview API
  const vscode = acquireVsCodeApi()

  // Track states
  let isLoggedIn = false
  let isMCPInstalled = false
  let hasInstructionFile = false
  let isCLIInstalled = false
  let isOrgInCodacy = false
  let isRepoInCodacy = false
  let userInfo = null
  let organizationInfo = null
  let repositoryInfo = null
  /**
   * Escapes HTML special characters to prevent XSS attacks.
   * @param {string | undefined | null} str - The string to escape
   * @returns {string} - The escaped string
   */
  function escapeHtml(str) {
    if (str == null) return ''
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  /**
   * Safely sets cloud description with highlighted text using DOM methods.
   * @param {HTMLElement} element - The element to update
   * @param {{type: 'organization' | 'repository' | 'user', params: {organization?: string, provider?: string, repository?: string, user?: string}}} context - The context to use
   */
  function setCloudDescription(element, { type, params }) {
    element.textContent = ''
    const textNode = document.createTextNode('Connected to ')
    const linkNode = document.createElement('a')
    const loadingHtml = `<div id="cloud-loading" class="loading-container">
            <div class="loading-spinner"></div>
            <p class="loading-text">Connecting to Codacy...</p>
          </div>`
    switch (type) {
      case 'organization':
        if (!params.provider || !params.organization) {
          element.innerHTML = loadingHtml
          return
        }
        linkNode.textContent = `${params.provider}/${params.organization}`
        linkNode.href = `https://app.codacy.com/organizations/${encodeURIComponent(params.provider)}/${encodeURIComponent(params.organization)}`
        break
      case 'repository':
        if (!params.provider || !params.organization || !params.repository) {
          element.innerHTML = loadingHtml
          return
        }
        linkNode.textContent = `${params.provider}/${params.organization}/${params.repository}`
        linkNode.href = `https://app.codacy.com/${encodeURIComponent(params.provider)}/${encodeURIComponent(params.organization)}/${encodeURIComponent(params.repository)}`
        break
      case 'user':
        if (!params.user) {
          element.innerHTML = loadingHtml
          return
        }
        linkNode.textContent = params.user ?? ''
        linkNode.href = `https://app.codacy.com/organizations`
        break
    }
    element.appendChild(textNode)
    element.appendChild(linkNode)
  }

  /**
   * Validates that the message origin is trusted for VS Code webview communication.
   * Valid origins: webview's own origin, 'vscode-webview://' protocol, or 'null' from extension host.
   * @param {string} origin - The origin to validate
   * @returns {boolean} - True if the origin is trusted
   */
  function isValidMessageOrigin(origin) {
    const expectedOrigin = window.location?.origin || ''

    // Check against allowlisted origins
    if (origin === expectedOrigin) {
      return true
    }

    // Extension host messages have 'null' origin
    if (origin === 'null') {
      return true
    }

    // VS Code webview protocol with valid webview ID format
    if (typeof origin === 'string' && /^vscode-webview:\/\/[a-zA-Z0-9-]+/.test(origin)) {
      return true
    }

    return false
  }

  /**
   * Handles validated messages from the VS Code extension.
   * @param {MessageEvent} event - The validated message event
   */
  function handleMessage(event) {
    const message = event.data
    if (!message || typeof message.type !== 'string') {
      return
    }
    switch (message.type) {
      case 'loginStateChanged':
        isLoggedIn = message.isLoggedIn
        isOrgInCodacy = message.isOrgInCodacy
        isRepoInCodacy = message.isRepoInCodacy
        userInfo = message.userInfo
        organizationInfo = message.organizationInfo
        repositoryInfo = message.repositoryInfo
        handleLoginStateChange(isLoggedIn, isOrgInCodacy, isRepoInCodacy, userInfo, organizationInfo, repositoryInfo)
        break
      case 'mcpStatusChanged':
        isMCPInstalled = message.isMCPInstalled
        hasInstructionFile = message.hasInstructionFile
        handleMCPStatusChange(isMCPInstalled, hasInstructionFile)
        break
      case 'cliStatusChanged':
        isCLIInstalled = message.isCLIInstalled
        isOrgInCodacy = message.isOrgInCodacy
        isRepoInCodacy = message.isRepoInCodacy
        handleCLIStatusChange(isCLIInstalled, isOrgInCodacy, isRepoInCodacy)
        break
      default:
        break
    }
  }

  // Request status on load
  vscode.postMessage({ type: 'checkLoginStatus' })
  vscode.postMessage({ type: 'checkMCPStatus' })
  vscode.postMessage({ type: 'checkCLIStatus' })

  // Handle messages sent from the extension to the webview
  // nosemgrep: javascript.browser.security.insufficient-postmessage-origin-validation
  window.addEventListener('message', (event) => {
    if (!isValidMessageOrigin(event.origin)) {
      return
    }
    handleMessage(event)
  })

  // ============================================
  // Login State Handlers
  // ============================================

  /**
   * Shows the logged in state
   * @param {Object} elements
   * @returns {void}
   */
  function showLoggedInState(elements) {
    if (!elements) return
    const {
      cloudIcon,
      connectToCodacyButton,
      iconUris,
    } = elements

    connectToCodacyButton.style.display = 'none'
    cloudIcon.src = iconUris.finished
  }
  /**
   * Shows the logged out state
   * @param {Object} elements
   * @returns {void}
   */
  function showLoggedOutState(elements) {
    if (!elements) return
    const {
      upgradeBox,
      upgradeButton,
      cloudIcon,
      cloudDescription,
      connectToCodacyButton,
      addOrgButton,
      addRepoButton,
      noOrgDescription,
      iconUris,
    } = elements

    upgradeBox.style.display = 'block'
    upgradeButton.setAttribute('href', 'https://www.codacy.com/pricing')
    cloudIcon.src = iconUris.unfinished
    cloudDescription.textContent = 'Customize local analysis and keep your PRs up to standards in the IDE.'
    addOrgButton.style.display = 'none'
    addRepoButton.style.display = 'none'
    noOrgDescription.style.display = 'none'
    connectToCodacyButton.style.display = 'inline-block'
  }

  /**
   * Handles the organization states
   * @param {Object} elements
   * @param {string} state
   * @returns {void}
   */
  function handleLoginOrgStates(elements, connectionInfo, state) {
    if (!elements) return
    const {
      upgradeBox,
      upgradeButton,
      cloudIcon,
      cloudDescription,
      addOrgButton,
      addRepoButton,
      noOrgDescription,
      iconUris,
    } = elements
    const { organizationName, organizationProvider, repositoryName, userName, billing } = connectionInfo
    switch (state) {
      case 'needsToAddOrganization':
        addOrgButton.style.display = 'inline-block'
        noOrgDescription.style.display = 'inline-block'
        addRepoButton.style.display = 'none'
        cloudIcon.src = iconUris.warning
        upgradeBox.style.display = 'block'
        upgradeButton.setAttribute('href', 'https://www.codacy.com/pricing')
        setCloudDescription(cloudDescription, { type: 'user', params: { user: userName } })
        break
      case 'needsToAddRepository':
        addRepoButton.style.display = 'inline-block'
        addOrgButton.style.display = 'none'
        noOrgDescription.style.display = 'inline-block'
        cloudIcon.src = iconUris.warning
        setCloudDescription(cloudDescription, {
          type: 'organization',
          params: { organization: organizationName, provider: organizationProvider },
        })
        if (billing.isPremium) {
          upgradeBox.style.display = 'none'
        } else {
          upgradeBox.style.display = 'block'
          upgradeButton.setAttribute(
            'href',
            `https://app.codacy.com/organizations/${encodeURIComponent(organizationProvider)}/${encodeURIComponent(organizationName)}/settings/billing`
          )
        }
        break
      case 'isInCodacy':
        addOrgButton.style.display = 'none'
        addRepoButton.style.display = 'none'
        noOrgDescription.style.display = 'none'
        setCloudDescription(cloudDescription, {
          type: 'repository',
          params: { organization: organizationName, provider: organizationProvider, repository: repositoryName },
        })
        if (billing.isPremium) {
          upgradeBox.style.display = 'none'
        } else {
          upgradeBox.style.display = 'block'
          upgradeButton.setAttribute(
            'href',
            `https://app.codacy.com/organizations/${encodeURIComponent(organizationProvider)}/${encodeURIComponent(organizationName)}/settings/billing`
          )
        }
        break
    }
  }

  /**
   * Handle login state changes
   * @param {boolean} loggedIn
   * @param {boolean} isOrgInCodacy
   * @param {boolean} isRepoInCodacy
   * @param {Object|null} userInfo
   * @param {Object|null} organizationInfo
   * @param {Object|null} repositoryInfo
   */
  function handleLoginStateChange(loggedIn, isOrgInCodacy, isRepoInCodacy, userInfo, organizationInfo, repositoryInfo) {
    const upgradeBox = document.getElementById('upgrade-box')
    const upgradeButton = document.getElementById('upgrade-button')
    /** @type {HTMLImageElement | null} */
    const cloudIcon = /** @type {HTMLImageElement | null} */ (document.getElementById('cloud-icon'))
    const cloudDescription = document.getElementById('cloud-description')
    const connectToCodacyButton = document.getElementById('connect-to-codacy-button')
    const addOrgButton = document.getElementById('add-org-button')
    const addRepoButton = document.getElementById('add-repo-button')
    const noOrgDescription = document.getElementById('cloud-no-org-description')
    // @ts-expect-error - iconUris is injected by the extension
    const iconUris = window.iconUris

    const elements = {
      cloudIcon,
      cloudDescription,
      addOrgButton,
      addRepoButton,
      noOrgDescription,
      upgradeBox,
      upgradeButton,
      connectToCodacyButton,
      iconUris,
    }
    if (loggedIn) {
      const organizationName = escapeHtml(organizationInfo?.organization?.name)
      const repositoryName = escapeHtml(repositoryInfo?.name)
      const userName = escapeHtml(userInfo?.name)
      const organizationProvider = escapeHtml(organizationInfo?.organization?.provider)
      const billing = organizationInfo?.billing

      const connectionInfo = { organizationName, organizationProvider, repositoryName, userName, billing }

      showLoggedInState(elements)
      if (isOrgInCodacy && isRepoInCodacy) {
        handleLoginOrgStates(elements, connectionInfo, 'isInCodacy')
      } else if (isOrgInCodacy) {
        handleLoginOrgStates(elements, connectionInfo, 'needsToAddRepository')
      } else {
        handleLoginOrgStates(elements, connectionInfo, 'needsToAddOrganization')
      }
    } else {
      showLoggedOutState(elements)
    }
  }

  // ============================================
  // MCP State Handlers
  // ============================================

  /**
   * Shows the uninstalled MCP state
   * @param {Object} elements
   * @returns {void}
   */
  function showUninstalledMCPState(elements) {
    if (!elements) return
    const { mcpHeaderActions, installMcpButton, generateInstructionsButton, mcpDescription, mcpIcon, iconUris } =
      elements
    mcpIcon.src = iconUris.unfinished
    mcpDescription.textContent = 'Control your AI generated code with Codacy Guardrails.'
    if (generateInstructionsButton) {
      generateInstructionsButton.style.display = 'none'
    }
    if (mcpHeaderActions) {
      mcpHeaderActions.style.display = 'none'
    }
    if (installMcpButton) {
      installMcpButton.style.display = 'block'
    }
  }

  function showInstalledMCPState(elements, hasInstructionFile) {
    if (!elements) return
    const { mcpHeaderActions, installMcpButton, generateInstructionsButton, mcpDescription, mcpIcon, iconUris } =
      elements
    if (mcpHeaderActions) {
      mcpHeaderActions.style.display = 'flex'
    }
    if (installMcpButton) {
      installMcpButton.style.display = 'none'
    }
    if (hasInstructionFile) {
      mcpIcon.src = iconUris.finished
      mcpDescription.textContent = 'Found MCP and instructions file'
      if (generateInstructionsButton) {
        generateInstructionsButton.style.display = 'none'
      }
    } else {
      mcpIcon.src = iconUris.warning
      mcpDescription.innerHTML = 'MCP installed.<br/>Instructions file not found.'
      if (generateInstructionsButton) {
        generateInstructionsButton.style.display = 'inline-block'
      }
    }
  }
  /**
   * Handles the MCP status changes
   * @param {boolean} isMCPInstalled
   * @param {boolean} hasInstructionFile
   * @returns {void}
   */
  function handleMCPStatusChange(isMCPInstalled, hasInstructionFile) {
    const mcpDescription = document.getElementById('mcp-description')
    const mcpHeaderActions = document.getElementById('mcp-header-actions')
    /** @type {HTMLImageElement | null} */
    const mcpIcon = /** @type {HTMLImageElement | null} */ (document.getElementById('mcp-icon'))
    const installMcpButton = /** @type {HTMLButtonElement | null} */ (document.getElementById('install-mcp-button'))
    const generateInstructionsButton = /** @type {HTMLButtonElement | null} */ (
      document.getElementById('generate-instructions-button')
    )
    /** @type {IconUris | undefined} */
    // @ts-expect-error - iconUris is injected by the extension
    const iconUris = window.iconUris

    const elements = {
      mcpIcon,
      mcpDescription,
      mcpHeaderActions,
      installMcpButton,
      generateInstructionsButton,
      iconUris,
    }

    if (mcpIcon && iconUris && mcpDescription) {
      if (isMCPInstalled) {
        showInstalledMCPState(elements, hasInstructionFile)
      } else {
        showUninstalledMCPState(elements)
      }
    }
  }

  // Set up click handlers for all buttons
  document.addEventListener('DOMContentLoaded', function () {
    // Generate instructions button
    const generateInstructionsButton = document.getElementById('generate-instructions-button')
    if (generateInstructionsButton) {
      generateInstructionsButton.addEventListener('click', function () {
        vscode.postMessage({ type: 'generateInstructionsFile' })
      })
    }

    // Connect to Codacy button
    const connectToCodacyButton = document.getElementById('connect-to-codacy-button')
    if (connectToCodacyButton) {
      connectToCodacyButton.addEventListener('click', function () {
        vscode.postMessage({ type: 'connectToCodacy' })
      })
    }

    // Add organization button
    const addOrgButton = document.getElementById('add-org-button')
    if (addOrgButton) {
      addOrgButton.addEventListener('click', function () {
        vscode.postMessage({ type: 'addOrganization' })
      })
    }

    // Add repository button
    const addRepoButton = document.getElementById('add-repo-button')
    if (addRepoButton) {
      addRepoButton.addEventListener('click', function () {
        vscode.postMessage({ type: 'addRepository' })
      })
    }

    // Install MCP button
    const installMcpButton = document.getElementById('install-mcp-button')
    if (installMcpButton) {
      installMcpButton.addEventListener('click', function () {
        vscode.postMessage({ type: 'installMCP' })
      })
    }

    // Install CLI button
    const installCliButton = document.getElementById('install-cli-button')
    if (installCliButton) {
      installCliButton.addEventListener('click', function () {
        vscode.postMessage({ type: 'installCLI' })
      })
    }

    // Add organization button in CLI section (link button)
    const addOrganizationButton = document.getElementById('add-organization-button')
    if (addOrganizationButton) {
      addOrganizationButton.addEventListener('click', function () {
        vscode.postMessage({ type: 'addOrganization' })
      })
    }

    // Add repository button in CLI section (link button)
    const addRepositoryButton = document.getElementById('add-repository-button')
    if (addRepositoryButton) {
      addRepositoryButton.addEventListener('click', function () {
        vscode.postMessage({ type: 'addRepository' })
      })
    }

    // MCP settings button
    const mcpSettingsButton = document.getElementById('mcp-settings-button')
    if (mcpSettingsButton) {
      mcpSettingsButton.addEventListener('click', function () {
        vscode.postMessage({ type: 'openMCPSettings' })
      })
    }

    // MCP refresh button
    const mcpRefreshButton = document.getElementById('mcp-refresh-button')
    if (mcpRefreshButton) {
      mcpRefreshButton.addEventListener('click', function () {
        vscode.postMessage({ type: 'refreshMCPStatus' })
      })
    }

    // CLI settings button
    const cliSettingsButton = document.getElementById('cli-settings-button')
    if (cliSettingsButton) {
      cliSettingsButton.addEventListener('click', function () {
        vscode.postMessage({ type: 'openCLISettings' })
      })
    }

    // CLI refresh button
    const cliRefreshButton = document.getElementById('cli-refresh-button')
    if (cliRefreshButton) {
      cliRefreshButton.addEventListener('click', function () {
        vscode.postMessage({ type: 'refreshCLIStatus' })
      })
    }
  })

  // ============================================
  // CLI State Handlers
  // ============================================

  /**
   * Shows the uninstalled CLI state
   * @param {Object} elements
   * @returns {void}
   */
  function showUninstalledCLIState(elements) {
    if (!elements) return
    const { cliHeaderActions, installCliButton, dependenciesDescription, cliDescription, cliIcon, iconUris } = elements
    if (cliHeaderActions) {
      cliHeaderActions.style.display = 'none'
    }
    if (installCliButton) {
      installCliButton.style.display = 'inline-block'
    }
    if (dependenciesDescription) {
      dependenciesDescription.style.display = 'inline-block'
    }
    cliDescription.textContent = 'Get instant feedback as you type by analyzing your code locally.'
    cliIcon.src = iconUris.unfinished
  }

  /**
   * Shows the installed CLI state
   * @param {Object} elements
   * @returns {void}
   */
  function showInstalledCLIState(elements) {
    if (!elements) return
    const { cliHeaderActions, installCliButton, dependenciesDescription, cliDescription } = elements
    if (cliHeaderActions) {
      cliHeaderActions.style.display = 'flex'
    }
    if (installCliButton) {
      installCliButton.style.display = 'none'
    }
    if (dependenciesDescription) {
      dependenciesDescription.style.display = 'none'
    }
    cliDescription.textContent = 'Codacy CLI installed'
  }

  /**
   * Handles the organization states for the CLI
   * @param {Object} elements
   * @param {string} state
   * @returns {void}
   */
  function handleCLIOrgStates(elements, state) {
    if (!elements) return
    const { addOrganizationSection, addRepositorySection, iconUris, cliIcon } = elements
    switch (state) {
      case 'needsToAddOrganization':
        addOrganizationSection.style.display = 'inline-block'
        addRepositorySection.style.display = 'none'
        cliIcon.src = iconUris.warning
        break
      case 'needsToAddRepository':
        addOrganizationSection.style.display = 'none'
        addRepositorySection.style.display = 'inline-block'
        cliIcon.src = iconUris.warning
        break
      case 'isInCodacy':
        addOrganizationSection.style.display = 'none'
        addRepositorySection.style.display = 'none'
        cliIcon.src = iconUris.finished
        break
    }
  }

  /**
   * Handles the CLI status changes
   * @param {boolean} isCLIInstalled
   * @param {boolean} isOrgInCodacy
   * @param {boolean} isRepoInCodacy
   * @returns {void}
   */
  function handleCLIStatusChange(isCLIInstalled, isOrgInCodacy, isRepoInCodacy) {
    /** @type {HTMLImageElement | null} */
    const cliIcon = /** @type {HTMLImageElement | null} */ (document.getElementById('cli-icon'))
    const cliDescription = document.getElementById('cli-description')
    const addOrganizationSection = document.getElementById('add-organization-section')
    const addRepositorySection = document.getElementById('add-repository-section')
    const installCliButton = document.getElementById('install-cli-button')
    const cliHeaderActions = document.getElementById('cli-header-actions')
    const dependenciesDescription = document.getElementById('dependencies-description')
    /** @type {IconUris | undefined} */
    // @ts-expect-error - iconUris is injected by the extension
    const iconUris = window.iconUris

    const elements = {
      cliIcon,
      cliDescription,
      addOrganizationSection,
      addRepositorySection,
      installCliButton,
      cliHeaderActions,
      dependenciesDescription,
      iconUris,
    }

    if (cliIcon && iconUris && cliDescription) {
      if (addOrganizationSection && addRepositorySection) {
        addOrganizationSection.style.display = 'none'
        addRepositorySection.style.display = 'none'
      }
      if (isCLIInstalled) {
        showInstalledCLIState(elements)
        if (isOrgInCodacy && isRepoInCodacy) {
          handleCLIOrgStates(elements, 'isInCodacy')
        } else if (isOrgInCodacy) {
          handleCLIOrgStates(elements, 'needsToAddRepository')
        } else {
          handleCLIOrgStates(elements, 'needsToAddOrganization')
        }
      } else {
        showUninstalledCLIState(elements)
      }
    }
  }
})()
