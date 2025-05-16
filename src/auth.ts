import * as vscode from 'vscode'
import { Config } from './common/config'
import { parseGitRemote } from './common/parseGitRemote'
import Logger from './common/logger'

export class AuthUriHandler extends vscode.EventEmitter<vscode.Uri> implements vscode.UriHandler {
  public handleUri(uri: vscode.Uri): void {
    this.fire(uri)

    const query = new URLSearchParams(uri.query)
    const token = query.get('token')
    const onboardingSkipped = query.get('onboardingSkipped')

    Config.updateOnboardingSkipped(onboardingSkipped === 'true')

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

export const getRepositoryUrl = async (): Promise<string | undefined> => {
  const gitProvider = vscode.extensions.getExtension('vscode.git')?.exports.getAPI(1)
  if (gitProvider && gitProvider.repositories.length > 0) {
    return (
      gitProvider.repositories[0].state.remotes[0]?.pushUrl || gitProvider.repositories[0].state.remotes[0]?.fetchUrl
    )
  }
  return undefined
}

export const codacyAuth = async () => {
  const remoteUrl = await getRepositoryUrl()
  const scheme = vscode.env.uriScheme

  // Get the first open repository
  const params = new URLSearchParams({ scheme })

  if (remoteUrl) {
    try {
      const { provider, organization, repository: repoName } = parseGitRemote(remoteUrl)
      params.set('provider', provider)
      params.set('organization', organization)
      params.set('repository', repoName)
    } catch (e) {
      Logger.error(`Error parsing git remote: ${e}`)
    }
  }

  const editor = detectEditor()
  const uri = vscode.Uri.parse(`${Config.baseUri}/auth/${editor}?${params.toString()}`)
  await vscode.env.openExternal(uri)
}
