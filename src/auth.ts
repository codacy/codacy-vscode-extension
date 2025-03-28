import * as vscode from 'vscode'
import { Config } from './common/config'

export class AuthUriHandler extends vscode.EventEmitter<vscode.Uri> implements vscode.UriHandler {
  public handleUri(uri: vscode.Uri): void {
    this.fire(uri)

    const query = new URLSearchParams(uri.query)
    const token = query.get('token')

    if (!token) {
      return
    }

    Config.storeApiToken(token)
  }

  public static register(): vscode.Disposable {
    const handler = new AuthUriHandler()
    return vscode.window.registerUriHandler(handler)
  }
}

export type IDE = 'vscode' | 'cursor'

export const detectEditor = (): IDE => {
  return vscode.env.appName.toLowerCase().includes('cursor') ? 'cursor' : 'vscode'
}

export const signIn = async () => {
  const editor = detectEditor()
  const uri = vscode.Uri.parse(`${Config.baseUri}/auth/${editor}`)
  await vscode.env.openExternal(uri)
}
