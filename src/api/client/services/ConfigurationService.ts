/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddedStateResponse } from '../models/AddedStateResponse';
import type { BuildServerAnalysisSettingRequest } from '../models/BuildServerAnalysisSettingRequest';
import type { BuildServerAnalysisSettingResponse } from '../models/BuildServerAnalysisSettingResponse';
import type { ConfigurationStatusResponse } from '../models/ConfigurationStatusResponse';
import type { QualityGate } from '../models/QualityGate';
import type { QualitySettingsResponse } from '../models/QualitySettingsResponse';
import type { RepositoryQualitySettings } from '../models/RepositoryQualitySettings';
import type { RepositoryQualitySettingsResponse } from '../models/RepositoryQualitySettingsResponse';
import type { SshKeySettingResponse } from '../models/SshKeySettingResponse';
import type { SyncProviderSettingResponse } from '../models/SyncProviderSettingResponse';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class ConfigurationService {

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
   * Get configuration status
   * Get configuration status
   * @returns ConfigurationStatusResponse Successful operation
   * @throws ApiError
   */
  public static getConfigurationStatus(): CancelablePromise<ConfigurationStatusResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/configuration/status',
      errors: {
        500: `Internal Server Error`,
      },
    });
  }

}
