import * as vscode from 'vscode'
import { AnalysisService, ConfigurationService, OpenAPI } from './client'
import Logger from '../common/logger'
// import { Client } from '@codacy/api-typescript/lib/client'

OpenAPI.HEADERS = async () => {
  const wsConfig = vscode.workspace.getConfiguration('codacy')
  const token = wsConfig.get<string>('apiToken')

  Logger.appendLine(`Token: ${token}`)

  return token
    ? {
        'api-token': token,
      }
    : undefined
}

export class Api {
  static Configuration = ConfigurationService
  static Analysis = AnalysisService
}

// export class ApiClient implements vscode.Disposable {
//   private _disposables: vscode.Disposable[]
//   private _token?: string

//   constructor() {
//     const wsConfig = vscode.workspace.getConfiguration('codacy')

//     this._disposables = []
//     this._token = wsConfig.get('apiToken') // TODO: remove this later when we add authentication
//   }

//   dispose() {
//     this._disposables.forEach((disposable) => disposable.dispose())
//   }
// }

// export class Api {
//   private static _instance: ApiClient

//   static get client(): ApiClient {
//     if (!Api._instance) {
//       Api._instance = new ApiClient()
//     }

//     return Api._instance
//   }
// }
