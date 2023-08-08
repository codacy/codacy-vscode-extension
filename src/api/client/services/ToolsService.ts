/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DuplicationToolListResponse } from '../models/DuplicationToolListResponse';
import type { MetricsToolListResponse } from '../models/MetricsToolListResponse';
import type { PatternListResponse } from '../models/PatternListResponse';
import type { ToolListResponse } from '../models/ToolListResponse';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class ToolsService {

  /**
   * Retrieves the list of tools
   * Lists the available tools in Codacy
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @returns ToolListResponse Successful operation
   * @throws ApiError
   */
  public static listTools(
    cursor?: string,
    limit: number = 100,
  ): CancelablePromise<ToolListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/tools',
      query: {
        'cursor': cursor,
        'limit': limit,
      },
      errors: {
        400: `Bad Request`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Retrieve the list of tool patterns
   * Lists the available patterns for the given tool
   * @param toolUuid Tool unique identifier
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @returns PatternListResponse Successful operations
   * @throws ApiError
   */
  public static listPatterns(
    toolUuid: string,
    cursor?: string,
    limit: number = 100,
  ): CancelablePromise<PatternListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/tools/{toolUuid}/patterns',
      path: {
        'toolUuid': toolUuid,
      },
      query: {
        'cursor': cursor,
        'limit': limit,
      },
      errors: {
        400: `Bad Request`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Retrieves the list of tools
   * Lists the available duplication tools in Codacy
   * @returns DuplicationToolListResponse Successful operation
   * @throws ApiError
   */
  public static listDuplicationTools(): CancelablePromise<DuplicationToolListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/duplicationTools',
      errors: {
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Retrieves the list of tools
   * Lists the available metrics tools in Codacy
   * @returns MetricsToolListResponse Successful operation
   * @throws ApiError
   */
  public static listMetricsTools(): CancelablePromise<MetricsToolListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/metricsTools',
      errors: {
        500: `Internal Server Error`,
      },
    });
  }

}
