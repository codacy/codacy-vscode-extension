/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeleteDormantAccountsResponse } from '../models/DeleteDormantAccountsResponse';
import type { License } from '../models/License';
import type { LicenseResponse } from '../models/LicenseResponse';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AdminService {

  /**
   * (non self-hosted admins only) Generates a license for self-hosted instances of Codacy
   * @param licenseBody
   * @returns LicenseResponse Successful operation
   * @throws ApiError
   */
  public static generateLicense(
    licenseBody: License,
  ): CancelablePromise<LicenseResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/admin/license',
      body: licenseBody,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * (Codacy Self-hosted admins only) Delete Codacy users based on a CSV file exported by GitHub Enterprise
   * @param csvFileContents CSV file containing email addresses of the users to delete in a column called "email"
   * @returns DeleteDormantAccountsResponse Successful operation
   * @throws ApiError
   */
  public static deleteDormantAccounts(
    csvFileContents: string,
  ): CancelablePromise<DeleteDormantAccountsResponse> {
    return __request(OpenAPI, {
      method: 'DELETE',
      url: '/admin/dormantAccounts',
      body: csvFileContents,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
        500: `Internal Server Error`,
      },
    });
  }

}
