import * as vscode from 'vscode'
import { CommandType, wrapCommandWithCatch } from './common/utils'
import { helloWorld, signIn } from './commands/index'
import Logger from './common/logger'

const registerCommands = (context: vscode.ExtensionContext) => {
  const commands: Record<string, CommandType> = {
    'codacy.helloWorld': helloWorld,
    'codacy.signIn': signIn,
  }

  Object.keys(commands).forEach((cmd) => {
    context.subscriptions.push(vscode.commands.registerCommand(cmd, wrapCommandWithCatch(commands[cmd])))
  })
}

export function activate(context: vscode.ExtensionContext) {
  Logger.appendLine('Codacy extension activated')
  context.subscriptions.push(Logger)

  registerCommands(context)
}

// This method is called when your extension is deactivated
export function deactivate() {
  return
}
