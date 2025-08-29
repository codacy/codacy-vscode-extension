import * as vscode from 'vscode'
import Logger from './logger'

export class Config {
  private _wsConfig: vscode.WorkspaceConfiguration | undefined
  private _apiToken: string | undefined
  private _onboardingSkipped: boolean | undefined
  private _devMode: boolean | undefined

  private static _instance: Config | undefined

  private static _onDidConfigChange = new vscode.EventEmitter<Config>()
  static readonly onDidConfigChange: vscode.Event<Config> = this._onDidConfigChange.event

  private constructor(private _secretStorage: vscode.SecretStorage) {
    this._wsConfig = vscode.workspace.getConfiguration('codacy')
  }

  public static async init(context: vscode.ExtensionContext) {
    Config._instance = new Config(context.secrets)

    const res = await Config._instance?._secretStorage.get('codacy.apiToken')
    Config._instance._apiToken = res

    // Initialize dev mode from workspace configuration
    Config._instance._devMode = Config._instance._wsConfig?.get('cli.devMode') === true

    if (Config._instance._apiToken) Logger.appendLine('Codacy API token found')
    if (Config._instance._onboardingSkipped) Logger.appendLine('No information about onboarding on Codacy found')

    // Set dev mode context for views
    await vscode.commands.executeCommand('setContext', 'codacy:devMode', Config._instance._devMode)

    this._onDidConfigChange.fire(Config._instance)
    return Config._instance
  }

  public static async storeApiToken(value: string | undefined) {
    if (!Config._instance) return

    Config._instance._apiToken = value

    if (value) {
      if (Config._instance._apiToken) Logger.appendLine('Storing API token...')
      await Config._instance._secretStorage.store('codacy.apiToken', value)
    } else {
      if (Config._instance._apiToken) Logger.appendLine('Removing API token...')
      await Config._instance._secretStorage.delete('codacy.apiToken')
    }

    this._onDidConfigChange.fire(Config._instance)
  }

  public static async updateOnboardingSkipped(value: boolean | undefined) {
    if (!Config._instance) return

    Config._instance._onboardingSkipped = value

    if (value) {
      if (Config._instance._onboardingSkipped) Logger.appendLine('Storing Onboarding Step as incomplete...')
      await vscode.commands.executeCommand('setContext', 'codacy:onboardingSkipped', true)
    } else {
      if (Config._instance._onboardingSkipped) Logger.appendLine('User completed onboarding step')
      await vscode.commands.executeCommand('setContext', 'codacy:onboardingSkipped', false)
    }
  }

  public static get baseUri(): string {
    return Config._instance?._wsConfig?.get('baseUri') || 'https://app.codacy.com'
  }

  public static get apiToken(): string | undefined {
    return Config._instance?._apiToken
  }

  public static get devMode(): boolean {
    return Config._instance?._devMode === true
  }

  public static async updateDevMode() {
    if (!Config._instance) return

    Config._instance._wsConfig = vscode.workspace.getConfiguration('codacy')
    const currentDevMode = Config._instance._wsConfig?.get('cli.devMode') === true
    const hasChanged = Config._instance._devMode !== currentDevMode

    Config._instance._devMode = currentDevMode

    if (hasChanged) {
      Logger.appendLine(`Dev mode ${currentDevMode ? 'enabled' : 'disabled'}`)
      await vscode.commands.executeCommand('setContext', 'codacy:devMode', currentDevMode)
      this._onDidConfigChange.fire(Config._instance)
    }
  }
}
