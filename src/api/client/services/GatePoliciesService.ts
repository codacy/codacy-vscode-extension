/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplyGatePolicyToRepositoriesBody } from '../models/ApplyGatePolicyToRepositoriesBody';
import type { CreateGatePolicyBody } from '../models/CreateGatePolicyBody';
import type { GatePoliciesListResponse } from '../models/GatePoliciesListResponse';
import type { GetGatePolicyResultResponse } from '../models/GetGatePolicyResultResponse';
import type { ListRepositoriesFollowingGatePolicyResultResponse } from '../models/ListRepositoriesFollowingGatePolicyResultResponse';
import type { UpdateGatePolicyBody } from '../models/UpdateGatePolicyBody';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class GatePoliciesService {

  /**
   * Set the built-in Codacy gate policy as the default for an organization
   * This endpoint is experimental and still under development.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @returns void
   * @throws ApiError
   */
  public static setCodacyDefault(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/gate-policies/setCodacyDefault',
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
   * Delete a gate policy
   * This endpoint is experimental and still under development.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param gatePolicyId Identifier of the gate policy
   * @returns void
   * @throws ApiError
   */
  public static deleteGatePolicy(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    gatePolicyId: number,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/organizations/{provider}/{remoteOrganizationName}/gate-policies/{gatePolicyId}',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'gatePolicyId': gatePolicyId,
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
   * Update a gate policy
   * This endpoint is experimental and still under development.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param gatePolicyId Identifier of the gate policy
   * @param updateGatePolicyBody The new value for the name, is default option, or quality gates of the gate policy
   * @returns GetGatePolicyResultResponse Successful operation
   * @throws ApiError
   */
  public static updateGatePolicy(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    gatePolicyId: number,
    updateGatePolicyBody: UpdateGatePolicyBody,
  ): CancelablePromise<GetGatePolicyResultResponse> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/organizations/{provider}/{remoteOrganizationName}/gate-policies/{gatePolicyId}',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'gatePolicyId': gatePolicyId,
      },
      body: updateGatePolicyBody,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
        409: `Conflict`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Get a gate policy
   * This endpoint is experimental and still under development.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param gatePolicyId Identifier of the gate policy
   * @returns GetGatePolicyResultResponse Successful operation
   * @throws ApiError
   */
  public static getGatePolicy(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    gatePolicyId: number,
  ): CancelablePromise<GetGatePolicyResultResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/gate-policies/{gatePolicyId}',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'gatePolicyId': gatePolicyId,
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
   * Create a gate policy
   * This endpoint is experimental and still under development.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param createGatePolicyBody Details of the gate policy to create
   * @returns GetGatePolicyResultResponse Successful operation
   * @throws ApiError
   */
  public static createGatePolicy(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    createGatePolicyBody: CreateGatePolicyBody,
  ): CancelablePromise<GetGatePolicyResultResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/gate-policies',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      body: createGatePolicyBody,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
        409: `Conflict`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * List the gate policies for an organization
   * This endpoint is experimental and still under development.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @returns GatePoliciesListResponse Successful operation
   * @throws ApiError
   */
  public static listGatePolicies(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    cursor?: string,
    limit: number = 100,
  ): CancelablePromise<GatePoliciesListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/gate-policies',
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
   * List all repositories following a gate policy
   * This endpoint is experimental and still under development.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param gatePolicyId Identifier of the gate policy
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @returns ListRepositoriesFollowingGatePolicyResultResponse Successful operation
   * @throws ApiError
   */
  public static listRepositoriesFollowingGatePolicy(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    gatePolicyId: number,
    cursor?: string,
    limit: number = 100,
  ): CancelablePromise<ListRepositoriesFollowingGatePolicyResultResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/gate-policies/{gatePolicyId}/repositories',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'gatePolicyId': gatePolicyId,
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
   * Apply a gate policy to a list of repositories
   * Link or unlink a gate policy to a list of repositories.
   * This endpoint is experimental and still under development.
   *
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param gatePolicyId Identifier of the gate policy
   * @param applyGatePolicyToRepositoriesBody
   * @returns void
   * @throws ApiError
   */
  public static applyGatePolicyToRepositories(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    gatePolicyId: number,
    applyGatePolicyToRepositoriesBody: ApplyGatePolicyToRepositoriesBody,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'PUT',
      url: '/organizations/{provider}/{remoteOrganizationName}/gate-policies/{gatePolicyId}/repositories',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'gatePolicyId': gatePolicyId,
      },
      body: applyGatePolicyToRepositoriesBody,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

}
