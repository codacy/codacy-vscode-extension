/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddOrganizationBody } from '../models/AddOrganizationBody';
import type { AddOrganizationResponse } from '../models/AddOrganizationResponse';
import type { CheckSubmodulesResponse } from '../models/CheckSubmodulesResponse';
import type { ChurnFeedback } from '../models/ChurnFeedback';
import type { JiraIntegrationResponse } from '../models/JiraIntegrationResponse';
import type { JoinModeRequest } from '../models/JoinModeRequest';
import type { JoinResponse } from '../models/JoinResponse';
import type { LeaveOrgCheckResult } from '../models/LeaveOrgCheckResult';
import type { ListRequestsToJoinResponse } from '../models/ListRequestsToJoinResponse';
import type { MembershipPrivilegesBody } from '../models/MembershipPrivilegesBody';
import type { OrganizationBillingInformationResponse } from '../models/OrganizationBillingInformationResponse';
import type { OrganizationWithMetaResponse } from '../models/OrganizationWithMetaResponse';
import type { ProviderIntegrationSettingsBody } from '../models/ProviderIntegrationSettingsBody';
import type { ProviderIntegrationSettingsPatchBody } from '../models/ProviderIntegrationSettingsPatchBody';
import type { RepositoryListResponse } from '../models/RepositoryListResponse';
import type { SyncProviderSettingOrganizationResponse } from '../models/SyncProviderSettingOrganizationResponse';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class OrganizationService {

  /**
   * Get organization
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @returns OrganizationWithMetaResponse Successful operation
   * @throws ApiError
   */
  public static getOrganization(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
  ): CancelablePromise<OrganizationWithMetaResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
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
   * Delete organization
   * Delete organization
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param reasons Reasons
   * @returns void
   * @throws ApiError
   */
  public static deleteOrganization(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    reasons?: ChurnFeedback,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/organizations/{provider}/{remoteOrganizationName}',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      body: reasons,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        409: `Conflict`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Get detailed information about organization billing
   * Get detailed information about organization billing
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @returns OrganizationBillingInformationResponse Successful operation
   * @throws ApiError
   */
  public static organizationDetailedBilling(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
  ): CancelablePromise<OrganizationBillingInformationResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/billing',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
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
   * Sync the information about organization billing
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @returns void
   * @throws ApiError
   */
  public static syncMarketplaceBilling(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/billing/sync',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
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
   * Apply default settings to all repositories
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @returns void
   * @throws ApiError
   */
  public static applyProviderSettings(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/integrations/providerSettings/apply',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
        502: `Bad Gateway`,
      },
    });
  }

  /**
   * Get Git provider settings
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @returns ProviderIntegrationSettingsBody Successful operation
   * @throws ApiError
   */
  public static getProviderSettings(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
  ): CancelablePromise<ProviderIntegrationSettingsBody> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/integrations/providerSettings',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
        502: `Bad Gateway`,
      },
    });
  }

  /**
   * Create or update Git provider settings
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param providerIntegrationSettingsBody
   * @returns void
   * @throws ApiError
   */
  public static updateProviderSettings(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    providerIntegrationSettingsBody: ProviderIntegrationSettingsPatchBody,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/organizations/{provider}/{remoteOrganizationName}/integrations/providerSettings',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      body: providerIntegrationSettingsBody,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
        502: `Bad Gateway`,
      },
    });
  }

  /**
   * List an organization repositories for the authenticated user.
   * List an organization's repositories for the authenticated user.
   * For Bitbucket you must URL encode the cursor before using it in subsequent API calls, as the pagination comes directly from the Git provider.
   * This endpoint may return more results than those specified in the limit parameter.
   * If this endpoint doesn't return your repositories after you've made recent changes to the permissions on your Git provider,
   * use the endpoint [cleanCache](#cleanCache) to force refreshing the list of repositories for the authenticated user.
   *
   * **Note:** When applied to public repositories, this operation does not require authentication.
   *
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @param search Filter the results searching by this string.
   * @param filter RepositoryFilter
   * @param languages Languages filter
   * @returns RepositoryListResponse Successful operation
   * @throws ApiError
   */
  public static listOrganizationRepositories(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    cursor?: string,
    limit: number = 100,
    search?: string,
    filter?: 'Synced' | 'NotSynced' | 'AllSynced',
    languages?: string,
  ): CancelablePromise<RepositoryListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      query: {
        'cursor': cursor,
        'limit': limit,
        'search': search,
        'filter': filter,
        'languages': languages,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
        502: `Bad Gateway`,
      },
    });
  }

  /**
   * Configure what your organization members can do across the Codacy platform
   * Define the lowest permission level that can configure patterns, configure which file extensions and branches are analyzed, and ignore issues and files
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param permissionLevel New permission level
   * @returns void
   * @throws ApiError
   */
  public static patchOrganizationSettings(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    permissionLevel: MembershipPrivilegesBody,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/organizations/{provider}/{remoteOrganizationName}/analysisConfigurationMinimumPermission',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      body: permissionLevel,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Update the join mode of an organization
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param joinMode New join mode of the organization
   * @returns void
   * @throws ApiError
   */
  public static updateJoinMode(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    joinMode: JoinModeRequest,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/joinMode',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      body: joinMode,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Check if the user can leave the organization
   * Check if the user can leave the organization or returns the reasons why they can not.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @returns LeaveOrgCheckResult Successful operation
   * @throws ApiError
   */
  public static checkIfUserCanLeave(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
  ): CancelablePromise<LeaveOrgCheckResult> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/people/leave/check',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
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
   * List requests to join an organization
   * Endpoint to list requests to join an organization by provider and organization name
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @param search Filter the results searching by this string.
   * @returns ListRequestsToJoinResponse Successful operation
   * @throws ApiError
   */
  public static listOrganizationJoinRequests(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    cursor?: string,
    limit: number = 100,
    search?: string,
  ): CancelablePromise<ListRequestsToJoinResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/join',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      query: {
        'cursor': cursor,
        'limit': limit,
        'search': search,
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
   * Join an organization
   * Endpoint to join an organization by provider and name
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @returns JoinResponse Successful operation
   * @throws ApiError
   */
  public static joinOrganization(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
  ): CancelablePromise<JoinResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/join',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        402: `PaymentRequired`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Decline Requests to join an organization
   * Endpoint to decline request to join an organization by provider, name and user emails to be rejected
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param emailList List of emails
   * @returns void
   * @throws ApiError
   */
  public static declineRequestsToJoinOrganization(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    emailList: Array<string>,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/organizations/{provider}/{remoteOrganizationName}/join',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      body: emailList,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Delete a request to join an organization
   * Endpoint to delete a request to join an organization by provider, name and user id
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param accountIdentifier Account Identifier
   * @returns void
   * @throws ApiError
   */
  public static deleteOrganizationJoinRequest(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    accountIdentifier: number,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/organizations/{provider}/{remoteOrganizationName}/join/{accountIdentifier}',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'accountIdentifier': accountIdentifier,
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
   * Clean organization cache for the authenticated user
   * Clean cached information regarding the authenticated user on the specified organization, such as the list of repositories in the organization.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @returns void
   * @throws ApiError
   */
  public static cleanCache(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/cache/clean',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
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
   * Add an organization to Codacy
   * Add an organization from a Git provider to Codacy
   * @param addOrganizationParameter Informations of the organization to add
   * @returns AddOrganizationResponse Successful operation
   * @throws ApiError
   */
  public static addOrganization(
    addOrganizationParameter: AddOrganizationBody,
  ): CancelablePromise<AddOrganizationResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations',
      body: addOrganizationParameter,
      errors: {
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Synchronize Codacy organization name with the Git provider
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @returns SyncProviderSettingOrganizationResponse Successful operation
   * @throws ApiError
   */
  public static syncOrganizationName(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
  ): CancelablePromise<SyncProviderSettingOrganizationResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/settings/sync',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
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
   * Check if the submodules option is enabled for the organization
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @returns CheckSubmodulesResponse Successful operation
   * @throws ApiError
   */
  public static checkSubmodules(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
  ): CancelablePromise<CheckSubmodulesResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/settings/submodules/check',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
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
   * Create organization hooks
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @returns void
   * @throws ApiError
   */
  public static createOrganizationHooks(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/settings/hooks',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
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
   * Return the Jira integration of the organization.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @returns JiraIntegrationResponse Successful operation
   * @throws ApiError
   */
  public static getJiraIntegration(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
  ): CancelablePromise<JiraIntegrationResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/integrations/jira',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
        500: `Internal Server Error`,
        502: `Bad Gateway`,
      },
    });
  }

  /**
   * Create or Update the Jira integration of the organization.
   * @param oauthCode The OAuth code to allow authentication as the user installing the Jira App.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @returns JiraIntegrationResponse Successful operation
   * @throws ApiError
   */
  public static createOrUpdateJiraIntegration(
    oauthCode: string,
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
  ): CancelablePromise<JiraIntegrationResponse> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/organizations/{provider}/{remoteOrganizationName}/integrations/jira',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      query: {
        'oauthCode': oauthCode,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
        409: `Conflict`,
        500: `Internal Server Error`,
        502: `Bad Gateway`,
      },
    });
  }

  /**
   * Delete the Jira integration of the organization and associated resources.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @returns void
   * @throws ApiError
   */
  public static deleteJiraIntegration(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/organizations/{provider}/{remoteOrganizationName}/integrations/jira',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
        500: `Internal Server Error`,
        502: `Bad Gateway`,
      },
    });
  }

}
