/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiToken } from '../models/ApiToken';
import type { ApiTokenListResponse } from '../models/ApiTokenListResponse';
import type { IntegrationListResponse } from '../models/IntegrationListResponse';
import type { OrganizationListResponse } from '../models/OrganizationListResponse';
import type { UserBody } from '../models/UserBody';
import type { UserResponse } from '../models/UserResponse';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AccountService {

  /**
   * Get the authenticated user
   * Get the authenticated user
   * @returns UserResponse Successful operation
   * @throws ApiError
   */
  public static getUser(): CancelablePromise<UserResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/user',
      errors: {
        401: `Unauthorized`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * @returns void
   * @throws ApiError
   */
  public static deleteUser(): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/user',
      errors: {
        401: `Unauthorized`,
        409: `Conflict`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * @param userBody
   * @returns UserResponse Successful operation
   * @throws ApiError
   */
  public static patchUser(
    userBody: UserBody,
  ): CancelablePromise<UserResponse> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/user',
      body: userBody,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * List organizations for the authenticated user
   * List organizations for the authenticated user
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @returns OrganizationListResponse Successful operation
   * @throws ApiError
   */
  public static listUserOrganizations(
    cursor?: string,
    limit: number = 100,
  ): CancelablePromise<OrganizationListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/user/organizations',
      query: {
        'cursor': cursor,
        'limit': limit,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * List organizations for the authenticated user
   * List organizations for the authenticated user
   * @param provider Git provider
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @returns OrganizationListResponse Successful operation
   * @throws ApiError
   */
  public static listOrganizations(
    provider: 'bb' | 'gh' | 'gl',
    cursor?: string,
    limit: number = 100,
  ): CancelablePromise<OrganizationListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/user/organizations/{provider}',
      path: {
        'provider': provider,
      },
      query: {
        'cursor': cursor,
        'limit': limit,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * List integrations for the authenticated user
   * List integrations for the authenticated user
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @returns IntegrationListResponse Successful operation
   * @throws ApiError
   */
  public static listUserIntegrations(
    cursor?: string,
    limit: number = 100,
  ): CancelablePromise<IntegrationListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/user/integrations',
      query: {
        'cursor': cursor,
        'limit': limit,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * @param accountProvider Account Provider
   * @returns void
   * @throws ApiError
   */
  public static deleteIntegration(
    accountProvider: 'github' | 'google' | 'bitbucket' | 'gitlab',
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/user/integrations/{accountProvider}',
      path: {
        'accountProvider': accountProvider,
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
   * List the [account API tokens](https://docs.codacy.com/codacy-api/api-tokens/) of the authenticated user
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @returns ApiTokenListResponse Successful operation
   * @throws ApiError
   */
  public static getUserApiTokens(
    cursor?: string,
    limit: number = 100,
  ): CancelablePromise<ApiTokenListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/user/tokens',
      query: {
        'cursor': cursor,
        'limit': limit,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Create a new [account API token](https://docs.codacy.com/codacy-api/api-tokens/) for the authenticated user
   * @returns ApiToken Successful operation
   * @throws ApiError
   */
  public static createUserApiToken(): CancelablePromise<ApiToken> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/user/tokens',
      errors: {
        401: `Unauthorized`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Delete an [account API token](https://docs.codacy.com/codacy-api/api-tokens/) for the authenticated user by ID
   * @param tokenId API token ID
   * @returns void
   * @throws ApiError
   */
  public static deleteUserApiToken(
    tokenId: number,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/user/tokens/{tokenId}',
      path: {
        'tokenId': tokenId,
      },
      errors: {
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

}
