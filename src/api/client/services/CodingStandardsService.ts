/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApplyCodingStandardToRepositoriesBody } from '../models/ApplyCodingStandardToRepositoriesBody';
import type { ApplyCodingStandardToRepositoriesResultResponse } from '../models/ApplyCodingStandardToRepositoriesResultResponse';
import type { CodingStandardPatternsListResponse } from '../models/CodingStandardPatternsListResponse';
import type { CodingStandardRepositoriesListResponse } from '../models/CodingStandardRepositoriesListResponse';
import type { CodingStandardResponse } from '../models/CodingStandardResponse';
import type { CodingStandardsListResponse } from '../models/CodingStandardsListResponse';
import type { CodingStandardToolsListResponse } from '../models/CodingStandardToolsListResponse';
import type { CreateCodingStandardBody } from '../models/CreateCodingStandardBody';
import type { SetDefaultCodingStandardBody } from '../models/SetDefaultCodingStandardBody';
import type { ToolConfiguration } from '../models/ToolConfiguration';
import type { UpdateCodingStandardPatternsBody } from '../models/UpdateCodingStandardPatternsBody';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class CodingStandardsService {

  /**
   * List the coding standards for an organization, including draft coding standards
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @returns CodingStandardsListResponse List of coding standards for an organization
   * @throws ApiError
   */
  public static listCodingStandards(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
  ): CancelablePromise<CodingStandardsListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/coding-standards',
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
   * Create a draft coding standard for an organization. To promote the draft coding standard to effective coding standard, see [promoteDraftCodingStandard](#promotedraftcodingstandard)
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param createCodingStandardBody Details of the coding standard to create
   * @param sourceRepository Name of a repository in the same organization to use as a template when creating the new coding standard
   * @param sourceCodingStandard Identifier of an existing coding standard to use as a template when creating a new coding standard, including the enabled repositories and default coding standard status
   * @returns CodingStandardResponse Successfully created a coding standard
   * @throws ApiError
   */
  public static createCodingStandard(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    createCodingStandardBody: CreateCodingStandardBody,
    sourceRepository?: string,
    sourceCodingStandard?: number,
  ): CancelablePromise<CodingStandardResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/coding-standards',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      query: {
        'sourceRepository': sourceRepository,
        'sourceCodingStandard': sourceCodingStandard,
      },
      body: createCodingStandardBody,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
        409: `Conflict`,
        422: `Unprocessable Entity`,
        500: `An unexpected error occurred while creating a coding standard`,
      },
    });
  }

  /**
   * Get a coding standard
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param codingStandardId Coding standard identifier
   * @returns CodingStandardResponse Successful operation
   * @throws ApiError
   */
  public static getCodingStandard(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    codingStandardId: number,
  ): CancelablePromise<CodingStandardResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/coding-standards/{codingStandardId}',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'codingStandardId': codingStandardId,
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
   * Delete a coding standard
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param codingStandardId Coding standard identifier
   * @returns void
   * @throws ApiError
   */
  public static deleteCodingStandard(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    codingStandardId: number,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/organizations/{provider}/{remoteOrganizationName}/coding-standards/{codingStandardId}',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'codingStandardId': codingStandardId,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
        500: `An unexpected error occurred while deleting a coding standard`,
      },
    });
  }

  /**
   * List tools in a coding standard
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param codingStandardId Coding standard identifier
   * @returns CodingStandardToolsListResponse Successful operation
   * @throws ApiError
   */
  public static listCodingStandardTools(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    codingStandardId: number,
  ): CancelablePromise<CodingStandardToolsListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/coding-standards/{codingStandardId}/tools',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'codingStandardId': codingStandardId,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
        500: `An unexpected error occurred while listing the tools of the coding standard`,
      },
    });
  }

  /**
   * Set the default coding standard for an organization
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param codingStandardId Coding standard identifier
   * @param setDefaultCodingStandard
   * @returns any Successful operation
   * @throws ApiError
   */
  public static setDefaultCodingStandard(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    codingStandardId: number,
    setDefaultCodingStandard: SetDefaultCodingStandardBody,
  ): CancelablePromise<any> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/coding-standards/{codingStandardId}/setDefault',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'codingStandardId': codingStandardId,
      },
      body: setDefaultCodingStandard,
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
   * List the code patterns configured for a tool in a coding standard
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param codingStandardId Coding standard identifier
   * @param toolUuid Tool unique identifier
   * @param languages Languages filter
   * @param categories Filter by a comma separated list of code pattern categories. The allowed values are 'Security', 'ErrorProne', 'CodeStyle', 'Compatibility', 'UnusedCode', and 'Performance'
   * @param severityLevels Filter by a comma separated list of code pattern severity levels. The allowed values are 'Error', 'Warning', and 'Info'
   * @param sort Field used to sort the tool's code patterns.  The allowed values are 'category', 'recommended', and 'severity'
   * @param direction Sort direction. Possible values are 'asc' (ascending) or 'desc' (descending).
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @returns CodingStandardPatternsListResponse Successful operation
   * @throws ApiError
   */
  public static listCodingStandardPatterns(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    codingStandardId: number,
    toolUuid: string,
    languages?: string,
    categories?: string,
    severityLevels?: string,
    sort?: string,
    direction?: string,
    cursor?: string,
    limit: number = 100,
  ): CancelablePromise<CodingStandardPatternsListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/coding-standards/{codingStandardId}/tools/{toolUuid}/patterns',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'codingStandardId': codingStandardId,
        'toolUuid': toolUuid,
      },
      query: {
        'languages': languages,
        'categories': categories,
        'severityLevels': severityLevels,
        'sort': sort,
        'direction': direction,
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
   * Bulk updates the code patterns of a tool in a coding standard.
   * Use filters to specify the code patterns to update, or omit the filters to update all code patterns.
   *
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param codingStandardId Coding standard identifier
   * @param toolUuid Tool unique identifier
   * @param updateCodingStandardPatternsBody
   * @param languages Languages filter
   * @param categories Filter by a comma separated list of code pattern categories. The allowed values are 'Security', 'ErrorProne', 'CodeStyle', 'Compatibility', 'UnusedCode', and 'Performance'
   * @param severityLevels Filter by a comma separated list of code pattern severity levels. The allowed values are 'Error', 'Warning', and 'Info'
   * @returns void
   * @throws ApiError
   */
  public static updateCodingStandardPatterns(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    codingStandardId: number,
    toolUuid: string,
    updateCodingStandardPatternsBody: UpdateCodingStandardPatternsBody,
    languages?: string,
    categories?: string,
    severityLevels?: string,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/coding-standards/{codingStandardId}/tools/{toolUuid}/patterns/update',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'codingStandardId': codingStandardId,
        'toolUuid': toolUuid,
      },
      query: {
        'languages': languages,
        'categories': categories,
        'severityLevels': severityLevels,
      },
      body: updateCodingStandardPatternsBody,
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
   * Configure a tool in a draft coding standard.
   * Toggle a tool and configure its code patterns in a draft coding standard.
   * Only the code patterns included in the body are updated, and if there are none only the enabled status of the tool is set.
   * You can only update draft coding standards and configure a maximum of 1000 code patterns per call.
   *
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param codingStandardId Coding standard identifier
   * @param toolUuid Tool unique identifier
   * @param toolConfiguration Configuration of a tool and its code patterns
   * @returns void
   * @throws ApiError
   */
  public static updateCodingStandardToolConfiguration(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    codingStandardId: number,
    toolUuid: string,
    toolConfiguration: ToolConfiguration,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/organizations/{provider}/{remoteOrganizationName}/coding-standards/{codingStandardId}/tools/{toolUuid}',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'codingStandardId': codingStandardId,
        'toolUuid': toolUuid,
      },
      body: toolConfiguration,
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
   * List the repositories that are using a coding standard
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param codingStandardId Coding standard identifier
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @returns CodingStandardRepositoriesListResponse Successful operation
   * @throws ApiError
   */
  public static listCodingStandardRepositories(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    codingStandardId: number,
    cursor?: string,
    limit: number = 100,
  ): CancelablePromise<CodingStandardRepositoriesListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/coding-standards/{codingStandardId}/repositories',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'codingStandardId': codingStandardId,
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
   * Apply a coding standard to a list of repositories
   * Link or unlink a coding standard to a list of repositories.
   * If the coding standard is a draft, the changes will only be effective when promoting the draft coding standard.
   *
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param codingStandardId Coding standard identifier
   * @param applyCodingStandardToRepositoriesBody
   * @returns ApplyCodingStandardToRepositoriesResultResponse Successful operation
   * @throws ApiError
   */
  public static applyCodingStandardToRepositories(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    codingStandardId: number,
    applyCodingStandardToRepositoriesBody: ApplyCodingStandardToRepositoriesBody,
  ): CancelablePromise<ApplyCodingStandardToRepositoriesResultResponse> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/organizations/{provider}/{remoteOrganizationName}/coding-standards/{codingStandardId}/repositories',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'codingStandardId': codingStandardId,
      },
      body: applyCodingStandardToRepositoriesBody,
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
   * Promote a draft coding standard to an effective coding standard. If the draft coding standard is marked as default, it becomes the new default coding standard
   * Returns the result of applying the coding standard to the repositories.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param codingStandardId Coding standard identifier
   * @returns ApplyCodingStandardToRepositoriesResultResponse Successful operation
   * @throws ApiError
   */
  public static promoteDraftCodingStandard(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    codingStandardId: number,
  ): CancelablePromise<ApplyCodingStandardToRepositoriesResultResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/coding-standards/{codingStandardId}/promote',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'codingStandardId': codingStandardId,
      },
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

}
