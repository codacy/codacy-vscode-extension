import * as vscode from 'vscode'
import * as os from 'os'
import { CommandType, wrapExtensionCommand } from './common/utils'
import Logger from './common/logger'
import { initializeApi } from './api'
import { GitProvider } from './git/GitProvider'
import { CodacyCloud } from './git/CodacyCloud'
import { PullRequestSummaryTree } from './views/PullRequestSummaryTree'
import { StatusBar } from './views/StatusBar'
import { IssueActionProvider, ProblemsDiagnosticCollection } from './views/ProblemsDiagnosticCollection'
import { Config } from './common/config'
import { AuthUriHandler, codacyAuth } from './auth'
import { IssueDetailsProvider, seeIssueDetailsCommand } from './views/IssueDetailsProvider'
import { PullRequestsTree } from './views/PullRequestsTree'
import { PullRequestNode } from './views/nodes/PullRequestNode'
import { BranchIssuesTree } from './views/BranchIssuesTree'
import { Account } from './codacy/Account'
import Telemetry from './common/telemetry'
import { decorateWithCoverage } from './views/coverage'
import { APIState, Repository as GitRepository } from './git/git'
import {
  configureGuardrails,
  configureMCP,
  createRules,
  isMCPConfigured,
  updateMCPConfig,
  updateMCPState,
} from './commands/configureMCP'
import { installCLICommand, updateCLIState, updateCodacyCLI } from './commands/installAnalysisCLI'
import { addRepository, joinOrganization } from './onboarding'
/**
 * Helper function to register all extension commands
 * @param context
 */
const registerCommands = async (context: vscode.ExtensionContext, codacyCloud: CodacyCloud) => {
  const commands: Record<string, CommandType> = {
    'codacy.codacyAuth': codacyAuth,
    'codacy.joinOrganization': () => joinOrganization(codacyCloud),
    'codacy.addRepository': () => addRepository(codacyCloud),
    'codacy.signOut': () => {
      Config.storeApiToken(undefined)
      Config.updateOnboardingSkipped(undefined)
      Account.clear()
      codacyCloud.clear()
    },
    'codacy.refresh': () => codacyCloud.refresh(),
    'codacy.pr.load': () => codacyCloud.loadPullRequest(),
    'codacy.pr.refresh': () => codacyCloud.pullRequest?.refresh(),
    'codacy.pr.checkout': (node: PullRequestNode) => {
      codacyCloud.checkout(node.pullRequest)
    },
    'codacy.pullRequests.refresh': () => codacyCloud.refreshPullRequests(),
    'codacy.branchIssues.refresh': () => codacyCloud.branchIssues.refresh(),
    'codacy.showOutput': () => Logger.outputChannel.show(),
    'codacy.issue.seeDetails': seeIssueDetailsCommand,
    'codacy.installCLI': async () => {
      await installCLICommand(codacyCloud.repository)
    },
    'codacy.configureMCP': async () => {
      await configureMCP(codacyCloud.repository)
      updateMCPState()
    },
    'codacy.configureGuardrails': async () => {
      await configureGuardrails(codacyCloud.repository)
      updateMCPState()
      await updateCLIState()
    },
    'codacy.configureMCP.reset': async () => {
      await configureMCP(codacyCloud.repository, true)
      updateMCPState()
    },
    'codacy.onboarding.complete': () => {
      const { provider, organization } = codacyCloud.params!
      vscode.env.openExternal(
        vscode.Uri.parse(`https://app.codacy.com/organizations/${provider}/${organization}/dashboard`)
      )
      Config.updateOnboardingSkipped(false)
    },
  }

  Object.keys(commands).forEach((cmd) => {
    context.subscriptions.push(vscode.commands.registerCommand(cmd, wrapExtensionCommand(commands[cmd], cmd)))
  })
}

/**
 * Register built in git provider
 * @param context
 */
const registerGitProvider = async (context: vscode.ExtensionContext, codacyCloud: CodacyCloud) => {
  const git = await GitProvider.init()

  if (git) {
    // register events
    git.onDidOpenRepository((repo: GitRepository) => {
      codacyCloud.open(repo)
    })

    git.onDidCloseRepository((repo: GitRepository) => {
      codacyCloud.close(repo)
      // Only set context to false if there are truly no repositories left
      if (git.repositories.length === 0) {
        vscode.commands.executeCommand('setContext', 'codacy:hasProject', false)
      }
    })

    git.onDidChangeState(async (state: APIState) => {
      if (state === 'initialized') {
        // Only set the context after we know the final state
        if (git.repositories.length > 0) {
          codacyCloud.open(git.repositories[0])
        } else {
          Logger.appendLine('No Git Repositories found')
          codacyCloud.clear()
        }
      }
    })

    context.subscriptions.push(git)

    return git
  } else {
    // Only set context to false if Git is truly not available
    Logger.error('Native Git VSCode extension not found')
    await vscode.commands.executeCommand('setContext', 'codacy:isGitRepository', false)
  }
}

/**
 * Entry point for the extension
 * @param context
 */
export async function activate(context: vscode.ExtensionContext) {
  Logger.appendLine('Codacy extension activated')
  context.subscriptions.push(Logger)

  // Listen for workspace folder changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      const hasWorkspaceFolder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
      vscode.commands.executeCommand('setContext', 'codacy:hasProject', hasWorkspaceFolder)
    })
  )

  // Set initial workspace folder state
  const hasWorkspaceFolder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
  await vscode.commands.executeCommand('setContext', 'codacy:hasProject', hasWorkspaceFolder)

  await vscode.commands.executeCommand(
    'setContext',
    'codacy:supportsMCP',
    vscode.env.appName.toLowerCase().includes('cursor') ||
      vscode.env.appName.toLowerCase().includes('windsurf') ||
      (vscode.env.appName.toLowerCase().includes('code') && !!vscode.extensions.getExtension('GitHub.copilot'))
  )

  await vscode.commands.executeCommand(
    'setContext',
    'codacy:canInstallCLI',
    os.platform() === 'darwin' || os.platform() === 'linux'
  )

  await vscode.commands.executeCommand('setContext', 'codacy:windowsDetected', os.platform() === 'win32')

  // Set isGitRepository to null by default, will be properly set by git provider logic
  // Using null instead of false prevents overriding the context when it shouldn't
  // This will ensure we don't set it to false when a repository is actually available
  await vscode.commands.executeCommand('setContext', 'codacy:isGitRepository', null)

  if (hasWorkspaceFolder) {
    Logger.appendLine('Codacy extension activated with workspace folder')
    Config.init(context)

    initializeApi()

    const codacyCloud = new CodacyCloud()
    context.subscriptions.push(codacyCloud)

    const gitProvider = await registerGitProvider(context, codacyCloud)

    if (!gitProvider) {
      Logger.error('Native Git VSCode extension not found')
      return
    }

    context.subscriptions.push(gitProvider)

    await registerCommands(context, codacyCloud)

    // initialize the problems diagnostic collection
    context.subscriptions.push(new ProblemsDiagnosticCollection(codacyCloud))

    // add views
    context.subscriptions.push(new PullRequestSummaryTree(context, codacyCloud))
    context.subscriptions.push(new StatusBar(context, codacyCloud))
    context.subscriptions.push(new PullRequestsTree(context, codacyCloud))
    context.subscriptions.push(new BranchIssuesTree(context, codacyCloud))

    context.subscriptions.push(AuthUriHandler.register())

    context.subscriptions.push(vscode.languages.registerCodeActionsProvider('*', new IssueActionProvider()))

    context.subscriptions.push(
      vscode.workspace.registerTextDocumentContentProvider('codacyIssue', new IssueDetailsProvider())
    )

    // listen for configuration changes
    context.subscriptions.push(
      Config.onDidConfigChange(() => {
        initializeApi()

        Account.current().then((user) => {
          if (user) Telemetry.identify(user)
        })

        if (gitProvider?.repositories.length) {
          codacyCloud.open(gitProvider.repositories[0])
        }

        Logger.appendLine('Updating MCP config')

        // Update MCP config now that we have a token and perhaps a repository
        updateMCPConfig(codacyCloud.repository)
      })
    )

    // check for open repository
    if (gitProvider.repositories.length > 0) {
      codacyCloud.open(gitProvider.repositories[0])
    }

    // coverage decoration
    const triggerCoverageDecoration = (editor: vscode.TextEditor | undefined) => {
      if (editor) {
        decorateWithCoverage(editor, editor.document.uri, codacyCloud.pullRequest)
      }
    }

    vscode.window.onDidChangeActiveTextEditor(triggerCoverageDecoration, null, context.subscriptions)

    const activeEditor = vscode.window.activeTextEditor
    if (activeEditor) {
      decorateWithCoverage(activeEditor, activeEditor?.document.uri, codacyCloud.pullRequest)
    }

    vscode.commands.registerCommand('codacy.pr.refreshCoverageDecoration', () => {
      if (vscode.window.activeTextEditor) {
        decorateWithCoverage(
          vscode.window.activeTextEditor,
          vscode.window.activeTextEditor?.document.uri,
          codacyCloud?.pullRequest
        )
      }
    })

    // coverage show/hide buttons
    vscode.commands.registerCommand('codacy.pr.toggleCoverage', (item: { onClick: () => void }) => {
      item.onClick()
    })

    const cliInstalled = await updateCLIState()
    const analysisMode = vscode.workspace.getConfiguration().get('codacy.cli.analysisMode')
    const cliVersion = vscode.workspace.getConfiguration().get('codacy.cli.cliVersion')
    // When the user doesn't have a specific version, update the CLI to the latest version
    if (!cliVersion && cliInstalled && analysisMode !== 'disabled') {
      await updateCodacyCLI(codacyCloud.repository)
      // If it is not installed, don't do anything. On the next usage of the CLI it will be installed with the most recent version
    }

    // Update initially
    updateMCPState()

    const generateRules = vscode.workspace.getConfiguration().get('codacy.guardrails.rulesFile')

    if (isMCPConfigured() && generateRules === 'enabled') {
      await createRules(codacyCloud.repository)
    }
  }
}

// This method is called when your extension is deactivated
export function deactivate() {
  Logger.appendLine('Codacy extension deactivated')

  return
}
