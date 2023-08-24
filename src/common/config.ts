import * as vscode from 'vscode'

export class Config {
  private _wsConfig: vscode.WorkspaceConfiguration | undefined
  private _apiToken: string | undefined

  private static _instance: Config | undefined

  private constructor(private _secretStorage: vscode.SecretStorage) {
    this._wsConfig = vscode.workspace.getConfiguration('codacy')
  }

  public static init(context: vscode.ExtensionContext) {
    this._instance = new Config(context.secrets)
    return this._instance
  }

  public static async getApiToken() {
    if (!this._instance) {
      return undefined
    }

    if (!this._instance._apiToken) {
      const res = await this._instance?._secretStorage.get('codacy.apiToken')
      this._instance._apiToken = res
      return res
    }

    return this._instance._apiToken
  }

  public static async storeApiToken(value: string | undefined) {
    if (value) {
      await this._instance?._secretStorage.store('codacy.apiToken', value)
    } else {
      await this._instance?._secretStorage.delete('codacy.apiToken')
    }
  }

  public static get baseUri(): string {
    return this._instance?._wsConfig?.get('baseUri') || 'https://api.codacy.com'
  }
}
