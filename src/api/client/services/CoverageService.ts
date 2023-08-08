/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CoveragePullRequestResponse } from '../models/CoveragePullRequestResponse';
import type { CoverageReportResponse } from '../models/CoverageReportResponse';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class CoverageService {

  /**
   * List all coverage reports uploaded for the common ancestor commit and head commit of a pull request branch
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param pullRequestNumber Pull request number
   * @returns CoveragePullRequestResponse Successful operation
   * @throws ApiError
   */
  public static getPullRequestCoverageReports(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    pullRequestNumber: number,
  ): CancelablePromise<CoveragePullRequestResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/analysis/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/pull-requests/{pullRequestNumber}/coverage/status',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
        'pullRequestNumber': pullRequestNumber,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Returns a list of the most recent coverage reports and their respective status
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param limit Maximum number of items to return
   * @returns CoverageReportResponse Successful operation
   * @throws ApiError
   */
  public static listCoverageReports(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    limit: number = 100,
  ): CancelablePromise<CoverageReportResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/coverage/status',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      query: {
        'limit': limit,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

}
