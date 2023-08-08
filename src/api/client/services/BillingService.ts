/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChurnFeedback } from '../models/ChurnFeedback';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class BillingService {

  /**
   * Delete billing subscription for organization
   * Delete billing subscription for organization
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param reasons Reasons
   * @returns void
   * @throws ApiError
   */
  public static deleteSubscription(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    reasons?: ChurnFeedback,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/billing/{provider}/{remoteOrganizationName}/subscription',
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

}
