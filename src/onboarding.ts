import { Api } from './api'
import * as vscode from 'vscode'
import { OrganizationService, Provider } from './api/client'
import { CodacyCloud, CodacyCloudState } from './git/CodacyCloud'

const ORGANIZATIONS_ITERATION_LIMIT = 5

const findOrganization = async (provider: Provider, organization: string, cursor?: string) => {
  try {
    let currentCursor = cursor
    let hasMore = true
    let iteration = 0
    while (hasMore && iteration < ORGANIZATIONS_ITERATION_LIMIT) {
      const { data: orgs, pagination } = await Api.Account.listOrganizations(provider, currentCursor, 100)
      const existingOrg = orgs.find((org) => org.name === organization && org.provider === provider)
      if (existingOrg) {
        return {
          success: true,
          organization: existingOrg,
        }
      }
      if (!pagination?.cursor) {
        hasMore = false
      } else {
        currentCursor = pagination.cursor
      }
      iteration++
    }
    return {
      success: false,
      message: 'Organization not found',
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to find organization: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

const pendingJoinOrganizationStatus = async () => {
  await vscode.window.showWarningMessage(
    "An admin must approve your request to join the organization on Codacy. You can continue, but the IDE won't get cloud data until your request is approved."
  )
  return CodacyCloudState.HasPendingJoinOrganization
}

export const getRepositoryCodacyCloudStatus = async (provider: Provider, organization: string) => {
  const findOrgResult = await findOrganization(provider, organization)
  if (!findOrgResult.success) {
    // Organization not found on Codacy; User needs to add the organization
    return CodacyCloudState.NeedsToAddOrganization
  }
  const { organization: existingOrg } = findOrgResult

  // Organization found on Codacy; Checking the join status;
  if (existingOrg?.joinStatus === 'member') {
    // Organization is already added; Probably the Repository is the one not added
    return CodacyCloudState.NeedsToAddRepository
  }
  if (existingOrg?.joinStatus === 'pendingMember') {
    return await pendingJoinOrganizationStatus()
  }
  if (existingOrg?.joinStatus === 'remoteMember') {
    if (existingOrg.identifier) {
      return CodacyCloudState.NeedsToJoinOrganization
    } else {
      // Organization is listed on Codacy; But it was not added on Codacy yet;
      return CodacyCloudState.NeedsToAddOrganization
    }
  }

  // Only show error if none of the conditions above match
  await vscode.window.showErrorMessage(`Organization status unknown: ${existingOrg?.joinStatus || 'undefined'}`)
  return CodacyCloudState.NoRepository
}

export const joinOrganization = async (codacyCloud: CodacyCloud) => {
  try {
    if (!codacyCloud.params) {
      throw new Error('Repository params not found')
    }
    const { joinStatus } = await Api.Organization.joinOrganization(
      codacyCloud.params.provider,
      codacyCloud.params.organization
    )
    if (joinStatus === 'member') {
      await vscode.window.showInformationMessage(
        'You joined the organization on Codacy successfully. Please restart the IDE.'
      )
    }
    if (joinStatus === 'pendingMember') {
      codacyCloud.state = CodacyCloudState.HasPendingJoinOrganization
    }
  } catch (error) {
    await vscode.window.showErrorMessage(
      `Failed to join organization: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// Following the same format as done in MCP Server
export const addRepository = async (codacyCloud: CodacyCloud) => {
  if (!codacyCloud.params) {
    throw new Error('Repository params not found')
  }
  const { provider, organization, repository } = codacyCloud.params

  const repositoryFullPath = `${organization}/${repository}`

  const { data: orgData } = await Api.Organization.getOrganization(provider, organization)
  const isAdmin = orgData.membership.userRole === 'admin'
  const { data } = await OrganizationService.listOrganizationRepositories(
    provider,
    organization,
    undefined,
    10,
    repository,
    'NotSynced'
  )
  const remoteRepository = data.find((repo) => repo.fullPath === repositoryFullPath)
  if (!remoteRepository) {
    await vscode.window.showErrorMessage(
      `Remote repository not found. Please check the permissions given to Codacy. Repository: ${repositoryFullPath}`
    )
  }
  if (remoteRepository?.addedState === 'Added') {
    if (!isAdmin) {
      try {
        await Api.Repository.followAddedRepository(provider, organization, repository)
        codacyCloud.state = CodacyCloudState.IsAnalyzing
        codacyCloud.checkRepositoryAnalysisStatus()
        await vscode.window.showInformationMessage('Repository added to Codacy. Checking analysis status...')
        return
      } catch (error) {
        const checkRepositoriesLink = 'Check your repositories'
        const showErrorDetails = 'Show error details'
        await vscode.window
          .showWarningMessage(
            `Repository couldn't be added. Cloud data won't load until the repository is added, but you can keep working.`,
            { modal: false },
            checkRepositoriesLink,
            showErrorDetails
          )
          .then((selection) => {
            if (selection === checkRepositoriesLink) {
              vscode.env.openExternal(
                vscode.Uri.parse(`https://app.codacy.com/organizations/${provider}/${organization}/repositories`)
              )
            } else if (selection === showErrorDetails) {
              vscode.window.showErrorMessage(
                `Error details: ${error instanceof Error ? error.message : 'Unknown error'}`
              )
            }
          })
        return
      }
    }
    await vscode.window.showInformationMessage('Repository was already added to Codacy. Please restart the IDE.')
    return
  }
  if (remoteRepository?.addedState === 'Following') {
    await vscode.window.showInformationMessage('Repository was already added to Codacy. Please restart the IDE.')
    return
  }
  try {
    await Api.Repository.addRepository({ provider, repositoryFullPath })
    codacyCloud.state = CodacyCloudState.IsAnalyzing
    codacyCloud.checkRepositoryAnalysisStatus()
    await vscode.window.showInformationMessage('Repository added to Codacy. Checking analysis status...')
    return
  } catch (error) {
    const checkRepositoriesLink = 'Check your repositories'
    const showErrorDetails = 'Show error details'
    await vscode.window
      .showWarningMessage(
        `Repository couldn't be added. Cloud data won't load until the repository is added, but you can keep working.`,
        { modal: false },
        checkRepositoriesLink,
        showErrorDetails
      )
      .then((selection) => {
        if (selection === checkRepositoriesLink) {
          vscode.env.openExternal(
            vscode.Uri.parse(`https://app.codacy.com/organizations/${provider}/${organization}/repositories`)
          )
        } else if (selection === showErrorDetails) {
          vscode.window.showErrorMessage(`Error details: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      })
  }
}

export const checkFirstAnalysisStatus = async (provider: Provider, organization: string, repository: string) => {
  try {
    const { data } = await Api.Analysis.getFirstAnalysisOverview(provider, organization, repository)
    return data
  } catch (error) {
    return false
  }
}
