/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Version } from '../models/Version';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class VersionService {

  /**
   * Return the version of the Codacy installation
   * @returns Version Successful operation
   * @throws ApiError
   */
  public static getVersion(): CancelablePromise<Version> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/version',
      errors: {
        401: `Unauthorized`,
        500: `Internal Server Error`,
      },
    });
  }

}
