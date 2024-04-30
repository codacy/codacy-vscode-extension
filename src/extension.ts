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
import { LocalToolsTree } from './views/LocalToolsTree'
import { handleLocalModeKeypress, LocalTool, runLocal, installLocal } from './local'



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
	function triggerCoverageDecoration(editor: vscode.TextEditor | undefined) {
		activeEditor = editor;
		if (editor) {
			decorateWithCoverage(editor, editor.document.uri, repositoryManager.pullRequest);
		}
	}

	let activeEditor = vscode.window.activeTextEditor;
	vscode.window.onDidChangeActiveTextEditor(triggerCoverageDecoration, null, context.subscriptions);

	if (activeEditor) {
		decorateWithCoverage(activeEditor, activeEditor?.document.uri, repositoryManager.pullRequest);
	}


  vscode.commands.registerCommand('codacy.pr.refreshCoverageDecoration', () => {
    if (vscode.window.activeTextEditor) {
      decorateWithCoverage(vscode.window.activeTextEditor, vscode.window.activeTextEditor?.document.uri, repositoryManager?.pullRequest)
    }
  });

// coverage show/hide buttons
  vscode.commands.registerCommand('codacy.pr.toggleCoverageOff', (item) => {item.onClick()});
  vscode.commands.registerCommand('codacy.pr.toggleCoverageOn', (item) => {item.onClick()});
  


//
// local mode
//

// most oss tools are not available to execute on the windows CLI.
// so we'll limit this window to linux/macos.
  if (['darwin','Linux'].includes(process.platform)) {

    const localToolsListJson = require('./../localTools.json')
    let localToolsList = Array<LocalTool>();
    for (let i=0; i<localToolsListJson.tools.length; i++) {
      let tool = new LocalTool(localToolsListJson.tools[i])
      localToolsList.push(tool)
    }
  
    const localToolsTree = new LocalToolsTree(context, repositoryManager, localToolsList);
    context.subscriptions.push(localToolsTree)
  
    const localDiags = vscode.languages.createDiagnosticCollection('codacy.local');
    const setLocalRunMode = (mode : string) => {
      vscode.commands.executeCommand('setContext', 'codacy.local:runMode', mode);
      localToolsTree.runMode = mode;
      localToolsTree.refresh();
      };

    vscode.commands.registerCommand('codacy.local.refresh', () => {
      localToolsTree.refresh();
    });

    context.subscriptions.push(vscode.commands.registerCommand('codacy.local.installMissingTools', () => {installLocal(localToolsList, localToolsTree)}));
    context.subscriptions.push(vscode.commands.registerCommand('codacy.local.runMode.executeManual', () => {runLocal(localDiags, localToolsList,vscode.window.activeTextEditor?.document.uri.fsPath)}));
  
    context.subscriptions.push(vscode.commands.registerCommand('codacy.local.runMode.setManual', () => {setLocalRunMode("manual")}));
    context.subscriptions.push(vscode.commands.registerCommand('codacy.local.runMode.setOnSave', () => {setLocalRunMode("save")}));
    context.subscriptions.push(vscode.commands.registerCommand('codacy.local.runMode.setOnHesitate', () => {setLocalRunMode("hesitate")}));
  
    context.subscriptions.push(vscode.commands.registerCommand('codacy.local.runMode.currentManual', () => {}));
    context.subscriptions.push(vscode.commands.registerCommand('codacy.local.runMode.currentOnSave', () => {}));
    context.subscriptions.push(vscode.commands.registerCommand('codacy.local.runMode.currentOnHesitate', () => {}));
    setLocalRunMode("manual");
  
    vscode.workspace.onDidSaveTextDocument((document: vscode.TextDocument) => {
      if (document.uri.scheme === "file" && localToolsTree.runMode === "save") {
        vscode.commands.executeCommand('codacy.local.runMode.executeManual');
      }
    });

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document && localToolsTree.runMode === 'hesitate') {
			handleLocalModeKeypress(localDiags, localToolsList);
		}
	}, null, context.subscriptions);
  
  }
}




// This method is called when your extension is deactivated
export function deactivate() {
  Logger.appendLine('Codacy extension deactivated')

  return
}
