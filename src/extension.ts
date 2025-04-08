import * as vscode from 'vscode'
import { CommandType, wrapCommandWithCatch } from './common/utils'
import Logger from './common/logger'
import { initializeApi } from './api'
import { GitProvider } from './git/GitProvider'
import { RepositoryManager } from './git/RepositoryManager'
import { PullRequestSummaryTree } from './views/PullRequestSummaryTree'
import { StatusBar } from './views/StatusBar'
import { IssueActionProvider, ProblemsDiagnosticCollection } from './views/ProblemsDiagnosticCollection'
import { Config } from './common/config'
import { AuthUriHandler, signIn } from './auth'
import { IssueDetailsProvider, seeIssueDetailsCommand } from './views/IssueDetailsProvider'
import { PullRequestsTree } from './views/PullRequestsTree'
import { PullRequestNode } from './views/nodes/PullRequestNode'
import { BranchIssuesTree } from './views/BranchIssuesTree'
import { Account } from './codacy/Account'
import Telemetry from './common/telemetry'
import { decorateWithCoverage } from './views/coverage'
import { APIState, Repository as GitRepository } from './git/git'
import { configureMCP, isMCPConfigured } from './commands/configureMCP'

/**
 * Helper function to register all extension commands
 * @param context
 */
const registerCommands = async (context: vscode.ExtensionContext, repositoryManager: RepositoryManager) => {
  const commands: Record<string, CommandType> = {
    'codacy.signIn': signIn,
    'codacy.signOut': () => {
      Config.storeApiToken(undefined)
      Account.clear()
    },
    'codacy.pr.load': () => repositoryManager.loadPullRequest(),
    'codacy.pr.refresh': () => repositoryManager.pullRequest?.refresh(),
    'codacy.pr.checkout': (node: PullRequestNode) => {
      repositoryManager.checkout(node.pullRequest)
    },
    'codacy.pullRequests.refresh': () => repositoryManager.refreshPullRequests(),
    'codacy.branchIssues.refresh': () => repositoryManager.branchIssues.refresh(),
    'codacy.showOutput': () => Logger.outputChannel.show(),
    'codacy.issue.seeDetails': seeIssueDetailsCommand,
  }

  Object.keys(commands).forEach((cmd) => {
    context.subscriptions.push(vscode.commands.registerCommand(cmd, wrapCommandWithCatch(commands[cmd])))
  })
}

/**
 * Register built in git provider
 * @param context
 */
const registerGitProvider = async (context: vscode.ExtensionContext, repositoryManager: RepositoryManager) => {
  const git = await GitProvider.init()

  if (git) {
    // register events
    git.onDidOpenRepository((repo: GitRepository) => {
      repositoryManager.open(repo)
    })

    git.onDidCloseRepository((repo: GitRepository) => {
      repositoryManager.close(repo)
    })

    git.onDidChangeState((state: APIState) => {
      if (state === 'initialized') {
        if (git.repositories.length > 0) {
          repositoryManager.open(git.repositories[0])
        } else {
          Logger.appendLine('No Git Repositories found')
          repositoryManager.clear()
        }
      }
    })

    context.subscriptions.push(git)

    return git
  }
}

/**
 * Entry point for the extension
 * @param context
 */
export async function activate(context: vscode.ExtensionContext) {
  Logger.appendLine('Codacy extension activated')
  context.subscriptions.push(Logger)

  await vscode.commands.executeCommand(
    'setContext',
    'codacy:supportsMCP',
    vscode.env.appName.toLowerCase().includes('cursor') ||
      vscode.env.appName.toLowerCase().includes('windsurf') ||
      vscode.env.appName.toLowerCase().includes('code')
  )

  Config.init(context)

  initializeApi()

  const repositoryManager = new RepositoryManager()
  context.subscriptions.push(repositoryManager)

  const gitProvider = await registerGitProvider(context, repositoryManager)

  if (!gitProvider) {
    Logger.error('Native Git VSCode extension not found')
    return
  }

  context.subscriptions.push(gitProvider)

  await registerCommands(context, repositoryManager)

  // initialize the problems diagnostic collection
  context.subscriptions.push(new ProblemsDiagnosticCollection(repositoryManager))

  // add views
  context.subscriptions.push(new PullRequestSummaryTree(context, repositoryManager))
  context.subscriptions.push(new StatusBar(context, repositoryManager))
  context.subscriptions.push(new PullRequestsTree(context, repositoryManager))
  context.subscriptions.push(new BranchIssuesTree(context, repositoryManager))

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
        repositoryManager.open(gitProvider.repositories[0])
      }
    })
  )

  // check for open repository
  if (gitProvider.repositories.length > 0) {
    repositoryManager.open(gitProvider.repositories[0])
  }

  // coverage decoration
  const triggerCoverageDecoration = (editor: vscode.TextEditor | undefined) => {
    if (editor) {
      decorateWithCoverage(editor, editor.document.uri, repositoryManager.pullRequest)
    }
  }

  vscode.window.onDidChangeActiveTextEditor(triggerCoverageDecoration, null, context.subscriptions)

  const activeEditor = vscode.window.activeTextEditor
  if (activeEditor) {
    decorateWithCoverage(activeEditor, activeEditor?.document.uri, repositoryManager.pullRequest)
  }

  vscode.commands.registerCommand('codacy.pr.refreshCoverageDecoration', () => {
    if (vscode.window.activeTextEditor) {
      decorateWithCoverage(
        vscode.window.activeTextEditor,
        vscode.window.activeTextEditor?.document.uri,
        repositoryManager?.pullRequest
      )
    }
  })

  // coverage show/hide buttons
  vscode.commands.registerCommand('codacy.pr.toggleCoverage', (item: { onClick: () => void }) => {
    item.onClick()
  })

  // Register MCP commands
  const updateMCPState = () => {
    const isConfigured = isMCPConfigured()
    vscode.commands.executeCommand('setContext', 'codacy:mcpConfigured', isConfigured)
  }

  // Update initially
  updateMCPState()

  // Register configure command
  context.subscriptions.push(
    vscode.commands.registerCommand('codacy.configureMCP', async () => {
      await configureMCP()
      updateMCPState()
    })
  )

  // Register reset command
  context.subscriptions.push(
    vscode.commands.registerCommand('codacy.configureMCP.reset', async () => {
      await configureMCP()
      updateMCPState()
    })
  )
}

// This method is called when your extension is deactivated
export function deactivate() {
  Logger.appendLine('Codacy extension deactivated')

  return
}
