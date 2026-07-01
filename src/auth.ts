import * as vscode from 'vscode'
import { Config } from './common/config'
import { parseGitRemote } from './common/parseGitRemote'
import Logger from './common/logger'
import { Api } from './api'

export class AuthUriHandler extends vscode.EventEmitter<vscode.Uri> implements vscode.UriHandler {
  public async handleUri(uri: vscode.Uri): Promise<void> {
    this.fire(uri)

    const query = new URLSearchParams(uri.query)
    const token = query.get('token')
    const onboardingSkipped = query.get('onboardingSkipped')

    Config.updateOnboardingSkipped(onboardingSkipped === 'true')

    if (!token) {
      return
    }

    Config.storeApiToken(token, true)

    await this.getToken(token)
  }

  public static register(): vscode.Disposable {
    const handler = new AuthUriHandler()
    return vscode.window.registerUriHandler(handler)
  }

  private async getToken(temporaryToken: string): Promise<void> {
    let accountToken
    let temporaryTokenId
    try {
      const response = await Api.Account.getUserApiTokens()
      const tokens = response.data
      temporaryTokenId = tokens.find((token) => token.token === temporaryToken)?.id

      // Pick a token that isn't the temporary one and won't expire within the next hour
      // (a token without `expiresAt` never expires and is always valid).
      const oneHourFromNow = Date.now() + 60 * 60 * 1000
      accountToken = tokens.find(
        (token) =>
          token.token !== temporaryToken && (!token.expiresAt || new Date(token.expiresAt).getTime() > oneHourFromNow)
      )?.token
      if (!accountToken) {
        try {
          const response = await Api.Account.createUserApiToken()
          Logger.debug(`Created new account token`)
          accountToken = response.token
        } catch (error) {
          Logger.error(
            `Failed to create new account token: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
          throw error
        }
      }
      Config.storeApiToken(accountToken)
    } catch (error) {
      Logger.error(`Failed to get user API tokens: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      if (temporaryTokenId) {
        Logger.appendLine(`Deleting temporary token...`)
        try {
          await Api.Account.deleteUserApiToken(temporaryTokenId)
        } catch (error) {
          Logger.error(`Failed to delete temporary token: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }
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
