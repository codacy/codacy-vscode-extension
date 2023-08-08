/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class ReportsService {

  /**
   * Generate a CSV file listing all security and risk management items for an organization.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @returns string CSV file containing the security and risk management items.
   * @throws ApiError
   */
  public static getReportSecurityItems(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
  ): CancelablePromise<string> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/reports/organizations/{provider}/{remoteOrganizationName}/security/items',
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
        501: `Not Implemented`,
      },
    });
  }

}
