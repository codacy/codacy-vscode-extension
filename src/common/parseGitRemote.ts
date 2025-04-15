const validProviders: Record<string, 'gh' | 'gl' | 'bb'> = {
  github: 'gh',
  gitlab: 'gl',
  bitbucket: 'bb',
}

interface GitRemoteInfo {
  provider: 'gh' | 'gl' | 'bb'
  organization: string
  repository: string
  originalRepository?: string
}

/**
 * Normalize repository name based on provider
 * For GitLab, extracts the last part of group/subgroup/project path
 */
const normalizeRepositoryName = (provider: 'gh' | 'gl' | 'bb', repository: string): string => {
  if (provider === 'gl') {
    // For GitLab, take the last part of the path
    const parts = repository.split('/')
    return parts[parts.length - 1]
  }
  return repository
}

/**
 * Parse a git remote URL into its component parts
 * @param remoteUrl
 * @returns GitRemoteInfo with normalized repository name and original if different
 */
export const parseGitRemote = (remoteUrl: string): GitRemoteInfo => {
  const pattern = /^.*(github|gitlab|bitbucket)\.(?:com|org)[:|/](.+?)\/(.+?)(\.git)?$/
  const match = remoteUrl.match(pattern)

  if (!match) {
    throw new Error(`Invalid remote url: ${remoteUrl}`)
  }

  const providerName = match[1]
  const organization = match[2]
  const originalRepository = match[3]

  const provider = validProviders[providerName]

  if (!provider) {
    throw new Error(`Invalid provider: ${providerName}`)
  }

  const repository = normalizeRepositoryName(provider, originalRepository)

  return {
    provider,
    organization,
    repository,
    ...(repository !== originalRepository && { originalRepository }),
  }
}
