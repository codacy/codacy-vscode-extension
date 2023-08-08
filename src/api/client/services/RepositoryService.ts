/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddedStateResponse } from '../models/AddedStateResponse';
import type { AddRepositoryBody } from '../models/AddRepositoryBody';
import type { ApiTokenListResponse } from '../models/ApiTokenListResponse';
import type { ApiTokenResponse } from '../models/ApiTokenResponse';
import type { BranchListResponse } from '../models/BranchListResponse';
import type { BuildServerAnalysisSettingRequest } from '../models/BuildServerAnalysisSettingRequest';
import type { BuildServerAnalysisSettingResponse } from '../models/BuildServerAnalysisSettingResponse';
import type { CommitUuidRequest } from '../models/CommitUuidRequest';
import type { CoverageReportResponse } from '../models/CoverageReportResponse';
import type { DiffResponse } from '../models/DiffResponse';
import type { FileInformationWithAnalysis } from '../models/FileInformationWithAnalysis';
import type { FileListResponse } from '../models/FileListResponse';
import type { FileStateBody } from '../models/FileStateBody';
import type { GetFileCoverageResponse } from '../models/GetFileCoverageResponse';
import type { QualityGate } from '../models/QualityGate';
import type { QualitySettingsResponse } from '../models/QualitySettingsResponse';
import type { Repository } from '../models/Repository';
import type { RepositoryQualitySettings } from '../models/RepositoryQualitySettings';
import type { RepositoryQualitySettingsResponse } from '../models/RepositoryQualitySettingsResponse';
import type { RepositoryResponse } from '../models/RepositoryResponse';
import type { SshKeySettingResponse } from '../models/SshKeySettingResponse';
import type { SyncProviderSettingResponse } from '../models/SyncProviderSettingResponse';
import type { UpdateRepositoryBranchConfigurationBody } from '../models/UpdateRepositoryBranchConfigurationBody';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class RepositoryService {

  /**
   * Follow a repository that was already added to Codacy
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @returns AddedStateResponse Successful operation
   * @throws ApiError
   */
  public static followAddedRepository(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
  ): CancelablePromise<AddedStateResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/follow',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * unfollow a repository
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @returns void
   * @throws ApiError
   */
  public static unfollowRepository(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/follow',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Get quality settings for the specific repository
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @returns RepositoryQualitySettingsResponse Successful operation
   * @throws ApiError
   */
  public static getQualitySettingsForRepository(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
  ): CancelablePromise<RepositoryQualitySettingsResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/settings/quality/repository',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Update quality settings for the specific repository
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param updatedQualitySettings The new value for the quality settings of the repository
   * @returns RepositoryQualitySettingsResponse Successful operation
   * @throws ApiError
   */
  public static updateRepositoryQualitySettings(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    updatedQualitySettings: RepositoryQualitySettings,
  ): CancelablePromise<RepositoryQualitySettingsResponse> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/settings/quality/repository',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      body: updatedQualitySettings,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Regenerate the user SSH key that Codacy uses to clone the repository
   * Codacy automatically adds the new public user SSH key to the user account on the Git provider. Using a user SSH key is recommended if your repository includes submodules.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @returns SshKeySettingResponse Successful operation
   * @throws ApiError
   */
  public static regenerateUserSshKey(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
  ): CancelablePromise<SshKeySettingResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/settings/ssh-user-key',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Regenerate the SSH key that Codacy uses to clone the repository
   * Codacy automatically adds the new public SSH key to the repository on the Git provider.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @returns SshKeySettingResponse Successful operation
   * @throws ApiError
   */
  public static regenerateRepositorySshKey(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
  ): CancelablePromise<SshKeySettingResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/settings/ssh-repository-key',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Get the public SSH key for the repository
   * Returns the most recently generated public SSH key, which can be either a user or repository SSH key.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @returns SshKeySettingResponse Successful operation
   * @throws ApiError
   */
  public static getRepositoryPublicSshKey(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
  ): CancelablePromise<SshKeySettingResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/settings/stored-ssh-key',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Synchronize project name and visibility with Git provider
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @returns SyncProviderSettingResponse Successful operation
   * @throws ApiError
   */
  public static syncRepositoryWithProvider(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
  ): CancelablePromise<SyncProviderSettingResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/settings/sync',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Get the status of the repository setting **Run analysis on your build server**
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @returns BuildServerAnalysisSettingResponse Successful operation
   * @throws ApiError
   */
  public static getBuildServerAnalysisSetting(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
  ): CancelablePromise<BuildServerAnalysisSettingResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/settings/analysis',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        405: `Method Not Allowed`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Updates the status of the repository setting **Run analysis on your build server**
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param targetBuildServerAnalysisSetting New value for the repository setting **Run analysis on your build server**
   * @returns BuildServerAnalysisSettingResponse Successful operation
   * @throws ApiError
   */
  public static updateBuildServerAnalysisSetting(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    targetBuildServerAnalysisSetting: BuildServerAnalysisSettingRequest,
  ): CancelablePromise<BuildServerAnalysisSettingResponse> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/settings/analysis',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      body: targetBuildServerAnalysisSetting,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        405: `Method Not Allowed`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Get quality settings for the commits of a repository.
   * `diffCoverageThreshold` is never returned because this threshold isn't currently supported for commits.
   *
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @returns QualitySettingsResponse Successful operation
   * @throws ApiError
   */
  public static getCommitQualitySettings(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
  ): CancelablePromise<QualitySettingsResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/settings/quality/commits',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Update quality settings for the commits of a repository
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param updatedQualitySettings The new value for the quality settings of commits in a repository
   * @returns QualitySettingsResponse Successful operation
   * @throws ApiError
   */
  public static updateCommitQualitySettings(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    updatedQualitySettings: QualityGate,
  ): CancelablePromise<QualitySettingsResponse> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/settings/quality/commits',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      body: updatedQualitySettings,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Reset quality settings for the commits of a repository to Codacy’s default values
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @returns QualitySettingsResponse Successful operation
   * @throws ApiError
   */
  public static resetCommitsQualitySettings(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
  ): CancelablePromise<QualitySettingsResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/settings/quality/commits/reset',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Reset quality settings for the pull requests of a repository to Codacy’s default values
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @returns QualitySettingsResponse Successful operation
   * @throws ApiError
   */
  public static resetPullRequestsQualitySettings(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
  ): CancelablePromise<QualitySettingsResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/settings/quality/pull-requests/reset',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Reset quality settings for the repository to Codacy’s default values
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @returns RepositoryQualitySettingsResponse Successful operation
   * @throws ApiError
   */
  public static resetRepositoryQualitySettings(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
  ): CancelablePromise<RepositoryQualitySettingsResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/settings/quality/repository/reset',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Get quality settings for the pull requests of a repository
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @returns QualitySettingsResponse Successful operation
   * @throws ApiError
   */
  public static getPullRequestQualitySettings(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
  ): CancelablePromise<QualitySettingsResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/settings/quality/pull-requests',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Update quality settings for the pull requests of a repository
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param updatedQualitySettings The new value for the quality settings of pull requests in the repository
   * @returns QualitySettingsResponse Successful operation
   * @throws ApiError
   */
  public static updatePullRequestQualitySettings(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    updatedQualitySettings: QualityGate,
  ): CancelablePromise<QualitySettingsResponse> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/settings/quality/pull-requests',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      body: updatedQualitySettings,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Reanalyze a specific commit in a repository
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param commitUuid UUID or SHA string that identifies the commit
   * @returns void
   * @throws ApiError
   */
  public static reanalyzeCommitById(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    commitUuid: CommitUuidRequest,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/reanalyzeCommit',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      body: commitUuid,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Fetch the specified repository
   * **Note:** When applied to public repositories, this operation does not require authentication.
   *
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @returns RepositoryResponse Successful operation
   * @throws ApiError
   */
  public static getRepository(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
  ): CancelablePromise<RepositoryResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Delete the specified repository
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @returns void
   * @throws ApiError
   */
  public static deleteRepository(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * List repository branches
   * **Note:** When applied to public repositories, this operation does not require authentication.
   *
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param enabled Returns only the enabled or disabled branches.
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @param search Filter the results searching by this string.
   * @param sort Field used to sort the list of branches. The allowed values are 'name' and 'last-updated'.
   * @param direction Sort direction. Possible values are 'asc' (ascending) or 'desc' (descending).
   * @returns BranchListResponse Successful operation
   * @throws ApiError
   */
  public static listRepositoryBranches(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    enabled?: boolean,
    cursor?: string,
    limit: number = 100,
    search?: string,
    sort?: string,
    direction?: string,
  ): CancelablePromise<BranchListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/branches',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      query: {
        'enabled': enabled,
        'cursor': cursor,
        'limit': limit,
        'search': search,
        'sort': sort,
        'direction': direction,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Update the settings for a repository branch
   * Toggle analysis for a branch.
   *
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param branchName Repository branch name
   * @param updateRepositoryBranchConfigurationBody
   * @returns void
   * @throws ApiError
   */
  public static updateRepositoryBranchConfiguration(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    branchName: string,
    updateRepositoryBranchConfigurationBody: UpdateRepositoryBranchConfigurationBody,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/branches/{branchName}',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
        'branchName': branchName,
      },
      body: updateRepositoryBranchConfigurationBody,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Set branch as default
   * Sets the default branch for a repository. The new default branch must already be enabled on Codacy.
   *
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param branchName Repository branch name
   * @returns void
   * @throws ApiError
   */
  public static setRepositoryBranchAsDefault(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    branchName: string,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/branches/{branchName}/setDefault',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
        'branchName': branchName,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Create a pull request adding the Codacy analysis badge to the repository
   * Creates a pull request adding the Codacy static code analysis badge
   * to the README of the GitHub repository if the repository is public
   * and doesn't already have a badge.
   *
   * **Note:** The pull request is created asynchronously and may fail
   * even if this endpoint responds successfully.
   *
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @returns void
   * @throws ApiError
   */
  public static createBadgePullRequest(
    remoteOrganizationName: string,
    repositoryName: string,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/gh/{remoteOrganizationName}/repositories/{repositoryName}/badge',
      path: {
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Add a repository to Codacy
   * Add a new repository to an existing organization on Codacy
   * @param addRepositoryParameter Information of repository to add
   * @param caller Caller
   * @returns Repository Successful operation
   * @throws ApiError
   */
  public static addRepository(
    addRepositoryParameter: AddRepositoryBody,
    caller?: string,
  ): CancelablePromise<Repository> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/repositories',
      headers: {
        'caller': caller,
      },
      body: addRepositoryParameter,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        402: `PaymentRequired`,
        403: `Forbidden`,
        404: `Not Found`,
        409: `Conflict`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * List files in a repository
   * Returns the most recent analysis information for the files in a repository as available on the [Files page](https://docs.codacy.com/repositories/files-view/).
   * Files that are [ignored on Codacy](https://docs.codacy.com/repositories-configure/ignoring-files/) aren't returned.
   *
   * **Note:** When applied to public repositories, this operation does not require authentication.
   *
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param branch Name of a [repository branch enabled on Codacy](https://docs.codacy.com/repositories-configure/managing-branches/),
   * as returned by the endpoint [listRepositoryBranches](#listrepositorybranches).
   * By default, uses the main branch defined on the Codacy repository settings.
   *
   * @param search Filter files that include this string anywhere in their relative path
   * @param sort Field used to sort the list of files. The allowed values are 'filename', 'issues', 'grade', 'duplication', 'complexity', and 'coverage'.
   * @param direction Sort direction. Possible values are 'asc' (ascending) or 'desc' (descending).
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @returns FileListResponse List of files in the repository
   * @throws ApiError
   */
  public static listFiles(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    branch?: string,
    search?: string,
    sort?: string,
    direction?: string,
    cursor?: string,
    limit: number = 100,
  ): CancelablePromise<FileListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/files',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      query: {
        'branch': branch,
        'search': search,
        'sort': sort,
        'direction': direction,
        'cursor': cursor,
        'limit': limit,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Get analysis information and coverage metrics for a file in a repository
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param fileId Identifier of a file in a specific commit
   * @returns FileInformationWithAnalysis File with analysis
   * @throws ApiError
   */
  public static getFileWithAnalysis(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    fileId: number,
  ): CancelablePromise<FileInformationWithAnalysis> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/files/{fileId}',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
        'fileId': fileId,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * List the [project API tokens](https://docs.codacy.com/codacy-api/api-tokens/) for a repository
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @returns ApiTokenListResponse Successful operation
   * @throws ApiError
   */
  public static listRepositoryApiTokens(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
  ): CancelablePromise<ApiTokenListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/tokens',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Create a new [project API token](https://docs.codacy.com/codacy-api/api-tokens/) for a repository
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @returns ApiTokenResponse Successful operation
   * @throws ApiError
   */
  public static createRepositoryApiToken(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
  ): CancelablePromise<ApiTokenResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/tokens',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Delete a [project API token](https://docs.codacy.com/codacy-api/api-tokens/) for a repository by ID
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param tokenId API token ID
   * @returns void
   * @throws ApiError
   */
  public static deleteRepositoryApiToken(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    tokenId: number,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/tokens/{tokenId}',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
        'tokenId': tokenId,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Returns a list of the most recent coverage reports and their respective status
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param limit Maximum number of items to return
   * @returns CoverageReportResponse Successful operation
   * @throws ApiError
   */
  public static listCoverageReports(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    limit: number = 100,
  ): CancelablePromise<CoverageReportResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/coverage/status',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      query: {
        'limit': limit,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Get coverage information for a file in the head commit of a repository branch.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param fileId Identifier of a file in a specific commit
   * @returns GetFileCoverageResponse File Coverage
   * @throws ApiError
   */
  public static getFileCoverage(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    fileId: number,
  ): CancelablePromise<GetFileCoverageResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/files/{fileId}/coverage',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
        'fileId': fileId,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Ignore or unignore a file
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param fileState
   * @returns void
   * @throws ApiError
   */
  public static updateFileState(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    fileState: FileStateBody,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/file',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      body: fileState,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Returns the human-readable Git diff of a pull request
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param pullRequestNumber Pull request number
   * @returns DiffResponse Successful operation
   * @throws ApiError
   */
  public static getPullRequestDiff(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    pullRequestNumber: number,
  ): CancelablePromise<DiffResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/pull-requests/{pullRequestNumber}/diff',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
        'pullRequestNumber': pullRequestNumber,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
        422: `Unprocessable Entity`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Returns the human-readable Git diff of a commit
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param commitUuid UUID or SHA string that identifies the commit
   * @returns DiffResponse Successful operation
   * @throws ApiError
   */
  public static getCommitDiff(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    commitUuid: string,
  ): CancelablePromise<DiffResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/commits/{commitUuid}/diff',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
        'commitUuid': commitUuid,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
        422: `Unprocessable Entity`,
        500: `Internal Server Error`,
      },
    });
  }

}
