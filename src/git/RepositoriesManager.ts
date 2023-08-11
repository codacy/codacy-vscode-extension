import * as vscode from 'vscode'
import { Repository as GitRepository } from './git'
import Logger from '../common/logger'
import { parseGitRemote } from '../common/parseGitRemote'
import { Api } from '../api'
import { CoreApiError, Repository } from '../api/client'

export enum RepositoryManagerState {
  NoRepository = 'NoRepository',
  NoRemote = 'NoRemote',
  Initializing = 'Initializing',
  NeedsAuthentication = 'NeedsAuthentication',
  Loaded = 'Loaded',
}

const RM_STATE_CONTEXT_KEY = 'RepositoryManagerStateContext'

export class RepositoryManager implements vscode.Disposable {
  private _current: GitRepository | undefined
  private _repository: Repository | undefined
  private _state: RepositoryManagerState = RepositoryManagerState.Initializing

  private _onDidChangeState = new vscode.EventEmitter<RepositoryManagerState>()
  readonly onDidChangeState: vscode.Event<RepositoryManagerState> = this._onDidChangeState.event

  private _onDidLoadRepository = new vscode.EventEmitter<Repository>()
  readonly onDidLoadRepository: vscode.Event<Repository> = this._onDidLoadRepository.event

  constructor() {
    vscode.commands.executeCommand('setContext', RM_STATE_CONTEXT_KEY, this._state)
  }

  public async open(repository: GitRepository) {
    const openRepository = async () => {
      this._current = repository

      try {
        if (repository.state.HEAD === undefined) {
          this.state = RepositoryManagerState.Initializing
        } else {
          if (!repository.state.remotes[0]?.pushUrl) {
            this.state = RepositoryManagerState.NoRemote
            Logger.error('No remote found')
            return
          }

          const repo = parseGitRemote(repository.state.remotes[0].pushUrl)
          const { data } = await Api.Repository.getRepository(repo.provider, repo.organization, repo.repository)

          this._repository = data
          this._onDidLoadRepository.fire(data)

          this.state = RepositoryManagerState.Loaded
        }
      } catch (e) {
        if (e instanceof CoreApiError) {
          const err = e as CoreApiError
          this.state = RepositoryManagerState.NeedsAuthentication
          Logger.error(`${err.message} (${err.statusText})`)
        } else {
          const err = e as Error
          this.state = RepositoryManagerState.NoRepository
          Logger.error(err.message)
        }
      }
    }

    vscode.window.withProgress({ location: { viewId: 'codacy:statuses' } }, openRepository)
  }

  public close(repository: GitRepository) {
    if (this._current === repository) {
      this.clear()
    }
  }

  public clear() {
    this._current = undefined
    this.state = RepositoryManagerState.NoRepository
  }

  get repository() {
    return this._repository
  }

  get state() {
    return this._state
  }

  set state(state: RepositoryManagerState) {
    const stateChange = state !== this._state
    this._state = state
    if (stateChange) {
      vscode.commands.executeCommand('setContext', RM_STATE_CONTEXT_KEY, state)
      this._onDidChangeState.fire(state)
    }
  }

  public dispose() {}
}
