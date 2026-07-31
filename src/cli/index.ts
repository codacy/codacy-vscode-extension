import * as vscode from 'vscode'
import { Config } from '../common'
import { CodacyCli } from './CodacyCli'

export type CliOptions = {
  provider?: string
  organization?: string
  repository?: string
}

export class Cli {
  private static _cliInstance: CodacyCli | null = null

  static async get(options: CliOptions) {
    if (!this.cliInstance) {
      return await this.createInstance(options)
    } else if (
      options.provider !== this.cliInstance.provider ||
      options.organization !== this.cliInstance.organization ||
      options.repository !== this.cliInstance.repository ||
      this.cliInstance._accountToken !== Config.apiToken
      // this.cliInstance._accountToken !== Config.apiToken : we added this to ensure we create a new instance of the CLI when the real token is stored and the temporary token is deleted
    ) {
      // If the options have changed, create a new instance
      this.cliInstance = null
      return await this.createInstance(options)
    } else {
      // If the options are the same, return the existing instance
      return this.cliInstance
    }
  }

  private static async createInstance(options: CliOptions) {
    const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ''

    const { provider, organization, repository } = options

    // A single implementation now works on every platform (the analyzer ships with
    // the extension as a Node library — no shell script, no WSL).
    this.cliInstance = new CodacyCli(rootPath, provider, organization, repository)

    // set Cli command if found
    await this.cliInstance.preflightCodacyCli(false)

    return this.cliInstance
  }

  public static get cliInstance() {
    return this._cliInstance
  }

  public static set cliInstance(instance: CodacyCli | null) {
    this._cliInstance = instance
  }
}

export { ProcessedSarifResult, processSarifResults } from './utils'
