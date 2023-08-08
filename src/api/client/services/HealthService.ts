/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { HealthCheckResponse } from '../models/HealthCheckResponse';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class HealthService {

  /**
   * Health check endpoint
   * Health check endpoint
   * @returns HealthCheckResponse Successful operation
   * @throws ApiError
   */
  public static health(): CancelablePromise<HealthCheckResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/health',
      errors: {
        500: `Internal Server Error`,
      },
    });
  }

}
