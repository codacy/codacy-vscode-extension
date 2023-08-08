/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AnalysisToolsResponse } from '../models/AnalysisToolsResponse';
import type { CategoryOverviewListResponse } from '../models/CategoryOverviewListResponse';
import type { CommitAnalysisStatsListResponse } from '../models/CommitAnalysisStatsListResponse';
import type { CommitDeltaIssuesResponse } from '../models/CommitDeltaIssuesResponse';
import type { CommitDeltaStatistics } from '../models/CommitDeltaStatistics';
import type { CommitWithAnalysis } from '../models/CommitWithAnalysis';
import type { CommitWithAnalysisListResponse } from '../models/CommitWithAnalysisListResponse';
import type { CopyPatternsBody } from '../models/CopyPatternsBody';
import type { CopyPatternsResponse } from '../models/CopyPatternsResponse';
import type { CoveragePullRequestResponse } from '../models/CoveragePullRequestResponse';
import type { DeprecatedRepositoryQualitySettingsResponse } from '../models/DeprecatedRepositoryQualitySettingsResponse';
import type { FileAnalysisListResponse } from '../models/FileAnalysisListResponse';
import type { FirstAnalysisOverviewResponse } from '../models/FirstAnalysisOverviewResponse';
import type { IgnoredIssuesListResponse } from '../models/IgnoredIssuesListResponse';
import type { IssuesOverviewResponse } from '../models/IssuesOverviewResponse';
import type { IssueStateBody } from '../models/IssueStateBody';
import type { PullRequestWithAnalysis } from '../models/PullRequestWithAnalysis';
import type { PullRequestWithAnalysisListResponse } from '../models/PullRequestWithAnalysisListResponse';
import type { RepositoryWithAnalysisListResponse } from '../models/RepositoryWithAnalysisListResponse';
import type { RepositoryWithAnalysisResponse } from '../models/RepositoryWithAnalysisResponse';
import type { SearchOrganizationRepositoriesWithAnalysis } from '../models/SearchOrganizationRepositoriesWithAnalysis';
import type { SearchRepositoryIssuesBody } from '../models/SearchRepositoryIssuesBody';
import type { SearchRepositoryIssuesListResponse } from '../models/SearchRepositoryIssuesListResponse';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AnalysisService {

  /**
   * List an organization repositories with analysis information for the authenticated user.
   * List an organization repositories with analysis information for the authenticated user. For Bitbucket you must URL encode the cursor before using it in subsequent API calls, as the pagination comes directly from the Git provider.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @param search Filter the results searching by this string.
   * @param repositories [Deprecated: Use [SearchOrganizationRepositoriesWithAnalysis](#searchorganizationrepositorieswithanalysis) instead] Comma separated list of repositories to get
   * @returns RepositoryWithAnalysisListResponse Successful operation
   * @throws ApiError
   */
  public static listOrganizationRepositoriesWithAnalysis(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    cursor?: string,
    limit: number = 100,
    search?: string,
    repositories?: string,
  ): CancelablePromise<RepositoryWithAnalysisListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/analysis/organizations/{provider}/{remoteOrganizationName}/repositories',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      query: {
        'cursor': cursor,
        'limit': limit,
        'search': search,
        'repositories': repositories,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
        502: `Bad Gateway`,
      },
    });
  }

  /**
   * Search organization repositories with analysis information for the authenticated user.
   * For Bitbucket you must URL encode the cursor before using it in subsequent API calls, as the pagination comes directly from the Git provider.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param searchOrganizationRepositoriesWithAnalysisBody Search query body
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @returns RepositoryWithAnalysisListResponse Successful operation
   * @throws ApiError
   */
  public static searchOrganizationRepositoriesWithAnalysis(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    searchOrganizationRepositoriesWithAnalysisBody: SearchOrganizationRepositoriesWithAnalysis,
    cursor?: string,
    limit: number = 100,
  ): CancelablePromise<RepositoryWithAnalysisListResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/search/analysis/organizations/{provider}/{remoteOrganizationName}/repositories',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      query: {
        'cursor': cursor,
        'limit': limit,
      },
      body: searchOrganizationRepositoriesWithAnalysisBody,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
        502: `Bad Gateway`,
      },
    });
  }

  /**
   * Get a repository with analysis information for the authenticated user
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param branch Name of a [repository branch enabled on Codacy](https://docs.codacy.com/repositories-configure/managing-branches/),
   * as returned by the endpoint [listRepositoryBranches](#listrepositorybranches).
   * By default, uses the main branch defined on the Codacy repository settings.
   *
   * @returns RepositoryWithAnalysisResponse Successful operation
   * @throws ApiError
   */
  public static getRepositoryWithAnalysis(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    branch?: string,
  ): CancelablePromise<RepositoryWithAnalysisResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/analysis/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      query: {
        'branch': branch,
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
   * Get analysis tools settings of a repository
   * **Note:** When applied to public repositories, this operation does not require authentication.
   *
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @returns AnalysisToolsResponse Successful operation
   * @throws ApiError
   */
  public static getTools(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
  ): CancelablePromise<AnalysisToolsResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/analysis/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/tools',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
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
   * Get the analysis progress of a repository
   * **Note:** When applied to public repositories, this operation does not require authentication.
   *
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param branch Name of a [repository branch enabled on Codacy](https://docs.codacy.com/repositories-configure/managing-branches/),
   * as returned by the endpoint [listRepositoryBranches](#listrepositorybranches).
   * By default, uses the main branch defined on the Codacy repository settings.
   *
   * @returns FirstAnalysisOverviewResponse Successful operation
   * @throws ApiError
   */
  public static getFirstAnalysisOverview(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    branch?: string,
  ): CancelablePromise<FirstAnalysisOverviewResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/analysis/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/analysis-progress',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      query: {
        'branch': branch,
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
   * Bulk copy the patterns from a given repository
   * Copy patterns from the selected repository to the targeted ones requested in the body of the operation.
   * This endpoints is limited to 100 target repositories.
   *
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param copyPatternsBulkBody Repository names to have their patterns imported to, maximum 100 items.
   * @returns CopyPatternsResponse Successful operation
   * @throws ApiError
   */
  public static copyPatternsBulk(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    copyPatternsBulkBody: CopyPatternsBody,
  ): CancelablePromise<CopyPatternsResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/analysis/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/patterns/copy',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      body: copyPatternsBulkBody,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        409: `Conflict`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * List pull requests from a repository that the user as access to
   * You can search this endpoint for either `last-updated` (default), `impact` or `merged`
   *
   * **Note:** When applied to public repositories, this operation does not require authentication.
   *
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param limit Maximum number of items to return
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param search Filter the results searching by this string.
   * @param includeNotAnalyzed If true, also return pull requests that weren't analyzed
   * @returns PullRequestWithAnalysisListResponse Successful operation
   * @throws ApiError
   */
  public static listRepositoryPullRequests(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    limit: number = 100,
    cursor?: string,
    search?: string,
    includeNotAnalyzed: boolean = false,
  ): CancelablePromise<PullRequestWithAnalysisListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/analysis/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/pull-requests',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      query: {
        'limit': limit,
        'cursor': cursor,
        'search': search,
        'includeNotAnalyzed': includeNotAnalyzed,
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
   * Get pull request from a repository
   * **Note:** When applied to public repositories, this operation does not require authentication.
   *
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param pullRequestNumber Pull request number
   * @returns PullRequestWithAnalysis Successful operation
   * @throws ApiError
   */
  public static getRepositoryPullRequest(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    pullRequestNumber: number,
  ): CancelablePromise<PullRequestWithAnalysis> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/analysis/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/pull-requests/{pullRequestNumber}',
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
   * Return analysis results for the commits in a pull request
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param pullRequestNumber Pull request number
   * @param limit Maximum number of items to return
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @returns CommitWithAnalysisListResponse Successful operation
   * @throws ApiError
   */
  public static getPullRequestCommits(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    pullRequestNumber: number,
    limit: number = 100,
    cursor?: string,
  ): CancelablePromise<CommitWithAnalysisListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/analysis/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/pull-requests/{pullRequestNumber}/commits',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
        'pullRequestNumber': pullRequestNumber,
      },
      query: {
        'limit': limit,
        'cursor': cursor,
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
   * @deprecated
   * [Deprecated: use [getQualitySettingsForRepository](#getqualitysettingsforrepository) instead]
   * Get quality settings for the specific repository
   *
   * **Note:** When applied to public repositories, this operation does not require authentication.
   *
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @returns DeprecatedRepositoryQualitySettingsResponse Successful operation
   * @throws ApiError
   */
  public static getRepositoryQualitySettings(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
  ): CancelablePromise<DeprecatedRepositoryQualitySettingsResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/analysis/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/quality-settings',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
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
   * List files of a commit with analysis results
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param commitUuid UUID or SHA string that identifies the commit
   * @param filter Optional field to filter the results. The possible values are empty (default, return files changed in the commit or with coverage changes) or `withCoverageChanges` (return files with coverage changes).
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @param search Filter files that include this string anywhere in their relative path
   * @param sortColumn Field used to sort the results. The possible values are `deltaCoverage` (to sort by the coverage variation value of the files) , `totalCoverage` (to sort by the total coverage value of the files) or `filename` (to sort by the name of the files).
   * @param columnOrder Sort direction. The possible values are `asc` (ascending) or `desc` (descending).
   * @returns FileAnalysisListResponse Successful operation
   * @throws ApiError
   */
  public static listCommitFiles(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    commitUuid: string,
    filter?: 'withCoverageChanges',
    cursor?: string,
    limit: number = 100,
    search?: string,
    sortColumn?: 'totalCoverage' | 'deltaCoverage' | 'filename',
    columnOrder?: 'asc' | 'desc',
  ): CancelablePromise<FileAnalysisListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/analysis/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/commits/{commitUuid}/files',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
        'commitUuid': commitUuid,
      },
      query: {
        'filter': filter,
        'cursor': cursor,
        'limit': limit,
        'search': search,
        'sortColumn': sortColumn,
        'columnOrder': columnOrder,
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
   * List files of a pull request with analysis results
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param pullRequestNumber Pull request number
   * @param filter Optional field to filter the results. The possible values are empty (default, return files changed in the commit or with coverage changes) or  `withCoverageChanges` (return only files with coverage changes).
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @param search Filter files that include this string anywhere in their relative path
   * @param sortColumn Field used to sort the results. The possible values are `deltaCoverage` (to sort by the coverage variation value of the files) , `totalCoverage` (to sort by the total coverage value of the files) or `filename` (to sort by the name of the files).
   * @param columnOrder Sort direction. The possible values are `asc` (ascending) or `desc` (descending).
   * @returns FileAnalysisListResponse Successful operation
   * @throws ApiError
   */
  public static listPullRequestFiles(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    pullRequestNumber: number,
    filter?: 'withCoverageChanges',
    cursor?: string,
    limit: number = 100,
    search?: string,
    sortColumn?: 'totalCoverage' | 'deltaCoverage' | 'filename',
    columnOrder?: 'asc' | 'desc',
  ): CancelablePromise<FileAnalysisListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/analysis/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/pull-requests/{pullRequestNumber}/files',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
        'pullRequestNumber': pullRequestNumber,
      },
      query: {
        'filter': filter,
        'cursor': cursor,
        'limit': limit,
        'search': search,
        'sortColumn': sortColumn,
        'columnOrder': columnOrder,
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
   * List an organization pull requests from repositories that the user as access to
   * You can search this endpoint for either `last-updated` (default), `impact` or `merged`
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param limit Maximum number of items to return
   * @param search Filter the results searching by this string.
   * @param repositories [Deprecated: Use [SearchOrganizationRepositoriesWithAnalysis](#searchorganizationrepositorieswithanalysis) instead] Comma separated list of repositories to get
   * @returns PullRequestWithAnalysisListResponse Successful operation
   * @throws ApiError
   */
  public static listOrganizationPullRequests(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    limit: number = 100,
    search?: string,
    repositories?: string,
  ): CancelablePromise<PullRequestWithAnalysisListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/analysis/organizations/{provider}/{remoteOrganizationName}/pull-requests',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      query: {
        'limit': limit,
        'search': search,
        'repositories': repositories,
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
   * Lists commit analysis statistics in the last `n` days that have analysis data
   * Returns the last `n` days with available data. This means that the returned days may not match the last `n` calendar days.
   *
   * **Note:** When applied to public repositories, this operation does not require authentication.
   *
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param branch Name of a [repository branch enabled on Codacy](https://docs.codacy.com/repositories-configure/managing-branches/),
   * as returned by the endpoint [listRepositoryBranches](#listrepositorybranches).
   * By default, uses the main branch defined on the Codacy repository settings.
   *
   * @param days Number of days with data to return.
   * @returns CommitAnalysisStatsListResponse Successful operation
   * @throws ApiError
   */
  public static listCommitAnalysisStats(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    branch?: string,
    days: number = 31,
  ): CancelablePromise<CommitAnalysisStatsListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/analysis/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/commit-statistics',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      query: {
        'branch': branch,
        'days': days,
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
   * Lists analysis category overviews for a repository that the user as access to
   * **Note:** When applied to public repositories, this operation does not require authentication.
   *
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param branch Name of a [repository branch enabled on Codacy](https://docs.codacy.com/repositories-configure/managing-branches/),
   * as returned by the endpoint [listRepositoryBranches](#listrepositorybranches).
   * By default, uses the main branch defined on the Codacy repository settings.
   *
   * @returns CategoryOverviewListResponse Successful operation
   * @throws ApiError
   */
  public static listCategoryOverviews(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    branch?: string,
  ): CancelablePromise<CategoryOverviewListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/analysis/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/category-overviews',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      query: {
        'branch': branch,
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
   * List issues in a repository
   * Returns information about the issues that Codacy found in a repository as available on the [Issues page](https://docs.codacy.com/repositories/issues-view/).
   * Use [SearchRepositoryIssuesBody](#tocssearchrepositoryissuesbody) to filter the returned issues.
   *
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param filters Only return issues matching these filters
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @returns SearchRepositoryIssuesListResponse List of issues in the repository
   * @throws ApiError
   */
  public static searchRepositoryIssues(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    filters?: SearchRepositoryIssuesBody,
    cursor?: string,
    limit: number = 100,
  ): CancelablePromise<SearchRepositoryIssuesListResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/analysis/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/issues/search',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      query: {
        'cursor': cursor,
        'limit': limit,
      },
      body: filters,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Get an overview of the issues in a repository
   * Returns information about the number of issues that Codacy found in a repository as available on the [Issues page](https://docs.codacy.com/repositories/issues-view/).
   * Use [SearchRepositoryIssuesBody](#tocssearchrepositoryissuesbody) to filter the returned issues.
   *
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param filters Only return issues matching these filters
   * @returns IssuesOverviewResponse Overview of the issues in the repository
   * @throws ApiError
   */
  public static issuesOverview(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    filters?: SearchRepositoryIssuesBody,
  ): CancelablePromise<IssuesOverviewResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/analysis/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/issues/overview',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      body: filters,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Ignore or unignore an issue
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param issueId Issue identifier
   * @param issueState New ignored status of the issue
   * @returns void
   * @throws ApiError
   */
  public static updateIssueState(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    issueId: string,
    issueState: IssueStateBody,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/analysis/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/issues/{issueId}',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
        'issueId': issueId,
      },
      body: issueState,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * List ignored issues in a repository
   * Returns information about the issues that Codacy found in a repository and were ignored on the Codacy UI. Use [SearchRepositoryIssuesBody](#tocssearchrepositoryissuesbody) to filter the returned ignored issues.
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param filters Only return issues matching these filters
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @returns IgnoredIssuesListResponse List of ignored issues in the repository
   * @throws ApiError
   */
  public static searchRepositoryIgnoredIssues(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    filters?: SearchRepositoryIssuesBody,
    cursor?: string,
    limit: number = 100,
  ): CancelablePromise<IgnoredIssuesListResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/analysis/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/ignoredIssues/search',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      query: {
        'cursor': cursor,
        'limit': limit,
      },
      body: filters,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Return analysis results for the commits in a branch
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param branch Name of a [repository branch enabled on Codacy](https://docs.codacy.com/repositories-configure/managing-branches/),
   * as returned by the endpoint [listRepositoryBranches](#listrepositorybranches).
   * By default, uses the main branch defined on the Codacy repository settings.
   *
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @returns CommitWithAnalysisListResponse List of commits with analysis results
   * @throws ApiError
   */
  public static listRepositoryCommits(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    branch?: string,
    cursor?: string,
    limit: number = 100,
  ): CancelablePromise<CommitWithAnalysisListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/analysis/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/commits',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      query: {
        'branch': branch,
        'cursor': cursor,
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

  /**
   * Get analysis results for a commit
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param commitUuid UUID or SHA string that identifies the commit
   * @returns CommitWithAnalysis Successful operation
   * @throws ApiError
   */
  public static getCommit(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    commitUuid: string,
  ): CancelablePromise<CommitWithAnalysis> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/analysis/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/commits/{commitUuid}',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
        'commitUuid': commitUuid,
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
   * Get analysis statistics of a commit
   * Returns the quality metric deltas introduced by a commit. The values of the metrics are 0 or null if Codacy didn't analyze the commit yet.
   * To obtain the full analysis statistics for the repository use the endpoint [getRepositoryWithAnalysis](#getrepositorywithanalysis).
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param commitUuid UUID or SHA string that identifies the commit
   * @returns CommitDeltaStatistics Succesful operation
   * @throws ApiError
   */
  public static getCommitDeltaStatistics(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    commitUuid: string,
  ): CancelablePromise<CommitDeltaStatistics> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/analysis/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/commits/{commitUuid}/deltaStatistics',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
        'commitUuid': commitUuid,
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
   * List the issues introduced or fixed by a commit
   * Returns a list of issues introduced or fixed given a source commit SHA. By default, Codacy will calculate the issues by creating a delta between the source commit and its parent commit. As an alternative, you can also provide a destination commit to calculate the deltas.
   * To list all issues in the repository, use [searchRepositoryIssues](#searchrepositoryissues).
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param srcCommitUuid UUID or SHA string that identifies the source commit
   * @param targetCommitUuid UUID or SHA string that identifies the target commit
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @returns CommitDeltaIssuesResponse Successful operation
   * @throws ApiError
   */
  public static listCommitDeltaIssues(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    srcCommitUuid: string,
    targetCommitUuid?: string,
    cursor?: string,
    limit: number = 100,
  ): CancelablePromise<CommitDeltaIssuesResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/analysis/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/commits/{srcCommitUuid}/deltaIssues',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
        'srcCommitUuid': srcCommitUuid,
      },
      query: {
        'targetCommitUuid': targetCommitUuid,
        'cursor': cursor,
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
