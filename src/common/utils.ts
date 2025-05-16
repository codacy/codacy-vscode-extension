import * as vscode from 'vscode'
import Logger from './logger'
import { ApiError, OpenAPIError } from '../api/client'
import Telemetry from './telemetry'

export class CodacyError extends Error {
  public readonly innerException?: Error
  public readonly component?: string

  constructor(message: string, _innerException?: Error, _component?: string) {
    super(message)

    this.name = 'CodacyError'
    this.innerException = _innerException
    this.component = _component
  }
}

export const handleError = (e: Error): void => {
  const showErrorMessage = async (message: string) => {
    const choice = await vscode.window.showErrorMessage(message, 'Show Logs')
    if (choice === 'Show Logs') {
      await vscode.commands.executeCommand('codacy.showOutput')
    }
  }

  if (e instanceof OpenAPIError) {
    const err = e as OpenAPIError

    if (err.body && err.body.message && err.body.actions) {
      const apiError = err.body as ApiError
      Logger.error(
        `${err.statusText} - ${apiError.message} ${apiError.innerMessage ? `(${apiError.innerMessage})` : ''}`
      )
      showErrorMessage(apiError.message).catch(console.error)
    } else {
      Logger.error(`${err.statusText} - ${err.message}`)
      showErrorMessage(err.message).catch(console.error)
    }
  } else if (e instanceof CodacyError) {
    const err = e as CodacyError
    Logger.error(`${err.name} - ${err.message}`)
    if (err.innerException) Logger.debug(`Inner Exception: ${err.innerException.message}`, err.component)
    showErrorMessage(err.message).catch(console.error)
  } else {
    const err = e as Error
    Logger.error(err.message)
  }
}

export type CommandType = Parameters<typeof vscode.commands.registerCommand>[1]

export const wrapExtensionCommand =
  (command: CommandType, key: string): CommandType =>
  async (...args) => {
    try {
      await command(...args)

      Telemetry.track(key.substring(7), {
        success: true,
      })
    } catch (e) {
      handleError(e as Error)

      Telemetry.track(key.substring(7), {
        success: false,
      })
    }
  }
