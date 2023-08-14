import * as vscode from 'vscode'
import { CommandType, wrapCommandWithCatch } from './common/utils'
import { signIn } from './commands'
import Logger from './common/logger'
import { initializeApi } from './api'
import { GitProvider } from './git/GitProvider'
import { RepositoryManager } from './git/RepositoriesManager'

/**
 * Helper function to register all extension commands
 * @param context
 */
const registerCommands = (context: vscode.ExtensionContext) => {
  const commands: Record<string, CommandType> = {
    'codacy.signIn': signIn,
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
    git.onDidOpenRepository((repo) => {
      repositoryManager.open(repo)
    })

    git.onDidCloseRepository((repo) => {
      repositoryManager.close(repo)
    })

    git.onDidChangeState((state) => {
      if (state === 'initialized') {
        if (git.repositories.length > 0) {
          repositoryManager.open(git.repositories[0])
        } else {
          Logger.appendLine('No Git Repositories found')
          repositoryManager.clear()
        }
      }
    })

    // git.onDidPublish((event) => {
    //   Logger.appendLine(`Git publish event: ${event}`)
    // })

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

  initializeApi()

  const repositoryManager = new RepositoryManager()

  await registerGitProvider(context, repositoryManager)

  registerCommands(context)
}

// This method is called when your extension is deactivated
export function deactivate() {
  Logger.appendLine('Codacy extension deactivated')

  return
}
