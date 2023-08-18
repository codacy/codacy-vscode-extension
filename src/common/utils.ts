import * as vscode from 'vscode'
import Logger from './logger'
import { CoreApiError } from '../api/client'

export const handleError = (e: Error): void => {
  if (e instanceof CoreApiError) {
    const err = e as CoreApiError
    Logger.error(`${err.message} (${err.statusText})`)
  } else {
    const err = e as Error
    Logger.error(err.message)
  }

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
