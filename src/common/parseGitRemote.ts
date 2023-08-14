const validProviders: Record<string, 'gh' | 'gl' | 'bb'> = {
  github: 'gh',
  gitlab: 'gl',
  bitbucket: 'bb',
}

/**
 * Parse a git remote URL into its component parts
 * @param remoteUrl
 * @returns
 */
export const parseGitRemote = (remoteUrl: string) => {
  const pattern = /^.*(github|gitlab|bitbucket)\.(?:com|org)[:|/](.+?)\/(.+?).git$/
  const match = remoteUrl.match(pattern)

  if (!match) {
    throw new Error(`Invalid remote url: ${remoteUrl}`)
  }

  const providerName = match[1]
  const organization = match[2]
  const repository = match[3]

  const provider = validProviders[providerName]

  if (!provider) {
    throw new Error(`Invalid provider: ${providerName}`)
  }

  return {
    provider,
    organization,
    repository,
  }
}
