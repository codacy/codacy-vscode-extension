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

export type IDE = 'vscode' | 'cursor' | 'windsurf'

export const detectEditor = (): IDE => {
  const appName = vscode.env.appName.toLowerCase()
  if (appName.includes('cursor')) return 'cursor'
  if (appName.includes('windsurf')) return 'windsurf'
  return 'vscode'
}

export const signIn = async () => {
  const editor = detectEditor()
  const uri = vscode.Uri.parse(`${Config.baseUri}/auth/${editor}`)
  await vscode.env.openExternal(uri)
}
