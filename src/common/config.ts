import * as vscode from 'vscode'

export class Config {
  private _wsConfig: vscode.WorkspaceConfiguration | undefined
  private _apiToken: string | undefined

  private static _instance: Config | undefined

  private static _onDidConfigChange = new vscode.EventEmitter<Config>()
  static readonly onDidConfigChange: vscode.Event<Config> = this._onDidConfigChange.event

  private constructor(private _secretStorage: vscode.SecretStorage) {
    this._wsConfig = vscode.workspace.getConfiguration('codacy')
  }

  public static async init(context: vscode.ExtensionContext) {
    this._instance = new Config(context.secrets)

    const res = await this._instance?._secretStorage.get('codacy.apiToken')
    this._instance._apiToken = res

    return this._instance
  }

  public static async storeApiToken(value: string | undefined) {
    if (!this._instance) return

    this._instance._apiToken = value

    if (value) {
      await this._instance._secretStorage.store('codacy.apiToken', value)
    } else {
      await this._instance._secretStorage.delete('codacy.apiToken')
    }

    this._onDidConfigChange.fire(this._instance)
  }

  public static get baseUri(): string {
    return this._instance?._wsConfig?.get('baseUri') || 'https://app.codacy.com'
  }

  public static get apiToken(): string | undefined {
    return this._instance?._apiToken
  }
}
