import * as vscode from 'vscode'
import { Config } from './common/config'
import { parseGitRemote } from './common/parseGitRemote'
import Logger from './common/logger'

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
  const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports
  const api = gitExtension?.getAPI(1)

  // Get the first open repository
  const repository = api?.repositories[0]
  let params = ''

  if (repository) {
    const remoteUrl = repository.state.remotes[0]?.fetchUrl || repository.state.remotes[0]?.pushUrl
    if (remoteUrl) {
      try {
        const { provider, organization, repository: repoName } = parseGitRemote(remoteUrl)
        params = `?provider=${provider}&organization=${organization}&repository=${repoName}`
      } catch (e) {
        Logger.error(`Error parsing git remote: ${e}`)
      }
    }
  }
  const editor = detectEditor()
  const uri = vscode.Uri.parse(`${Config.baseUri}/auth/${editor}${params}`)
  await vscode.env.openExternal(uri)
}
