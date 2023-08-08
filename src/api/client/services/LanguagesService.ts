/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LanguageListResponse } from '../models/LanguageListResponse';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class LanguagesService {

  /**
   * Retrieves the list of languages of available tools
   * Lists the languages of the available tools in Codacy
   * @returns LanguageListResponse Successful operation
   * @throws ApiError
   */
  public static listLanguagesWithTools(): CancelablePromise<LanguageListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/languages/tools',
      errors: {
        400: `Bad Request`,
        500: `Internal Server Error`,
      },
    });
  }

}
