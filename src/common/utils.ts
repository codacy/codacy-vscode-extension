import * as vscode from 'vscode'
import Logger from './logger'

export const handleError = (e: Error): void => {
  Logger.error(e.message)

  const showErrorMessage = async () => {
    const choice = await vscode.window.showErrorMessage(e.message, 'Show Logs')
    if (choice === 'Show Logs') {
      await vscode.commands.executeCommand('codacy.showOutput')
    }
  }

  showErrorMessage().catch(console.error)
}

export type CommandType = Parameters<typeof vscode.commands.registerCommand>[1]

export const wrapCommandWithCatch =
  (command: CommandType): CommandType =>
  async (...args) => {
    try {
      await command(...args)
    } catch (e) {
      handleError(e as Error)
    }
  }
