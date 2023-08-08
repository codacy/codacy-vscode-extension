/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConfiguredLoginIntegrationListResponse } from '../models/ConfiguredLoginIntegrationListResponse';
import type { ProviderIntegrationListResponse } from '../models/ProviderIntegrationListResponse';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class IntegrationsService {

  /**
   * List configured login providers on Codacy's platform
   * List configured login providers on Codacy's platform
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @returns ConfiguredLoginIntegrationListResponse Successful operation
   * @throws ApiError
   */
  public static listConfiguredLoginIntegrations(
    cursor?: string,
    limit: number = 100,
  ): CancelablePromise<ConfiguredLoginIntegrationListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/login/integrations',
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
   * List provider integrations existing on Codacy's platform
   * List provider integrations existing on Codacy's platform
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @returns ProviderIntegrationListResponse Successful operation
   * @throws ApiError
   */
  public static listProviderIntegrations(
    cursor?: string,
    limit: number = 100,
  ): CancelablePromise<ProviderIntegrationListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/provider/integrations',
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

}
