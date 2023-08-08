/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CheckSecurityManagerRoleResponse } from '../models/CheckSecurityManagerRoleResponse';
import type { SecurityManagerBody } from '../models/SecurityManagerBody';
import type { SecurityManagersResponse } from '../models/SecurityManagersResponse';
import type { SecurityRepositoriesResponse } from '../models/SecurityRepositoriesResponse';
import type { SRMDashboardResponse } from '../models/SRMDashboardResponse';
import type { SrmItemsResponse } from '../models/SrmItemsResponse';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class SecurityService {

  /**
   * Returns a paginated list of security and risk management items for an organization.
   * Repository filtering is limited to 100 names.
   *
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @param repositories [Deprecated: Use [SearchOrganizationRepositoriesWithAnalysis](#searchorganizationrepositorieswithanalysis) instead] Comma separated list of repositories to get
   * @param status
   * @param priority
   * @returns SrmItemsResponse Returns security and risk management items.
   * @throws ApiError
   */
  public static listSecurityItems(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    cursor?: string,
    limit: number = 100,
    repositories?: string,
    status?: 'Overdue' | 'OnTrack' | 'DueSoon' | 'ClosedOnTime' | 'ClosedLate',
    priority?: 'Low' | 'Medium' | 'High' | 'Critical',
  ): CancelablePromise<SrmItemsResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/security/items',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      query: {
        'cursor': cursor,
        'limit': limit,
        'repositories': repositories,
        'status': status,
        'priority': priority,
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
   * Returns the metrics for the security and risk management dashboard.
   * Repository filtering is limited to 100 names.
   *
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositories [Deprecated: Use [SearchOrganizationRepositoriesWithAnalysis](#searchorganizationrepositorieswithanalysis) instead] Comma separated list of repositories to get
   * @param priority
   * @returns SRMDashboardResponse Successful operation
   * @throws ApiError
   */
  public static getSecurityDashboard(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositories?: string,
    priority?: 'Low' | 'Medium' | 'High' | 'Critical',
  ): CancelablePromise<SRMDashboardResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/security/dashboard',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      query: {
        'repositories': repositories,
        'priority': priority,
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
   * Indicates if the authenticated user is a security manager for the organization provided.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @returns CheckSecurityManagerRoleResponse Returns true if the user is a security manager, otherwise returns false.
   * @throws ApiError
   */
  public static getUserSecurityRole(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
  ): CancelablePromise<CheckSecurityManagerRoleResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/security/role',
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
   * Returns a paginated list of organization admins and security managers.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @returns SecurityManagersResponse Returns security managers, including organization admins.
   * @throws ApiError
   */
  public static listSecurityManagers(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    cursor?: string,
    limit: number = 100,
  ): CancelablePromise<SecurityManagersResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/security/managers',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      query: {
        'cursor': cursor,
        'limit': limit,
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
   * Assign the Security Manager role to an organization member.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param securityManagerBody User ID of the organization member to be promoted to security manager.
   * @returns void
   * @throws ApiError
   */
  public static postSecurityManager(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    securityManagerBody: SecurityManagerBody,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/security/managers',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      body: securityManagerBody,
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
   * Revoke the Security Manager role from an organization member.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param userId Identifier of the organization member
   * @returns void
   * @throws ApiError
   */
  public static deleteSecurityManager(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    userId: number,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/organizations/{provider}/{remoteOrganizationName}/security/managers/{userId}',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'userId': userId,
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
   * Return a list of organization repositories that have security issues.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @returns SecurityRepositoriesResponse Successful operation.
   * @throws ApiError
   */
  public static listSecurityRepositories(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    cursor?: string,
    limit: number = 100,
  ): CancelablePromise<SecurityRepositoriesResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/security/repositories',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      query: {
        'cursor': cursor,
        'limit': limit,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
        500: `Internal Server Error`,
        501: `Not Implemented`,
      },
    });
  }

}
