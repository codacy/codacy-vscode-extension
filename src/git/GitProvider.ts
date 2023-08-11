import * as vscode from 'vscode'
import { GitExtension, API as GitAPI, Repository, APIState } from './git'
import Logger from '../common/logger'

export class GitProvider implements vscode.Disposable {
  get repositories(): Repository[] {
    return this._gitAPI.repositories
  }

  get state(): APIState {
    return this._gitAPI.state
  }

  private _onDidOpenRepository = new vscode.EventEmitter<Repository>()
  readonly onDidOpenRepository: vscode.Event<Repository> = this._onDidOpenRepository.event
  private _onDidCloseRepository = new vscode.EventEmitter<Repository>()
  readonly onDidCloseRepository: vscode.Event<Repository> = this._onDidCloseRepository.event
  private _onDidChangeState = new vscode.EventEmitter<APIState>()
  readonly onDidChangeState: vscode.Event<APIState> = this._onDidChangeState.event
  // private _onDidPublish = new vscode.EventEmitter<PublishEvent>()
  // readonly onDidPublish: vscode.Event<PublishEvent> = this._onDidPublish.event

  private _gitAPI: GitAPI
  private _disposables: vscode.Disposable[]

  private constructor(extension: vscode.Extension<GitExtension>) {
    const gitExtension = extension.exports

    try {
      this._gitAPI = gitExtension.getAPI(1)
    } catch (e) {
      Logger.error(`Git not installed`)
      throw e
    }

    this._disposables = []
    this._disposables.push(this._gitAPI.onDidCloseRepository((e) => this._onDidCloseRepository.fire(e)))
    this._disposables.push(this._gitAPI.onDidOpenRepository((e) => this._onDidOpenRepository.fire(e)))
    this._disposables.push(this._gitAPI.onDidChangeState((e) => this._onDidChangeState.fire(e)))
    // this._disposables.push(this._gitAPI.onDidPublish((e) => this._onDidPublish.fire(e)))
  }

  static async init(): Promise<GitProvider | undefined> {
    const extension = vscode.extensions.getExtension<GitExtension>('vscode.git')
    if (extension) {
      await extension.activate()
      return new GitProvider(extension)
    }
    return undefined
  }

  //   registerPostCommitCommandsProvider?(provider: any): vscode.Disposable {
  //     if (this._gitAPI.registerPostCommitCommandsProvider) {
  //       return this._gitAPI.registerPostCommitCommandsProvider(provider)
  //     }
  //     return {
  //       dispose: () => {},
  //     }
  //   }

  dispose() {
    this._disposables.forEach((disposable) => disposable.dispose())
  }
}
