/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ListPeopleResponse } from '../models/ListPeopleResponse';
import type { PersonPermissionResponse } from '../models/PersonPermissionResponse';
import type { RemovePeopleBody } from '../models/RemovePeopleBody';
import type { RemovePeopleResponse } from '../models/RemovePeopleResponse';
import type { RepositorySuggestedAuthorsResponse } from '../models/RepositorySuggestedAuthorsResponse';
import type { SuggestedAuthorsResponse } from '../models/SuggestedAuthorsResponse';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class PeopleService {

  /**
   * List people of an organization
   * List people of an organization
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @param search Filter the results searching by this string.
   * @param onlyMembers If true, returns only Codacy users. If false, returns also commit authors that aren't Codacy users.
   * @returns ListPeopleResponse Successful operation
   * @throws ApiError
   */
  public static listPeopleFromOrganization(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    cursor?: string,
    limit: number = 100,
    search?: string,
    onlyMembers: boolean = false,
  ): CancelablePromise<ListPeopleResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/people',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      query: {
        'cursor': cursor,
        'limit': limit,
        'search': search,
        'onlyMembers': onlyMembers,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Add people to organization
   * Add people to organization as members or committers (depending if they have a pending request already)
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param emailList List of emails
   * @returns void
   * @throws ApiError
   */
  public static addPeopleToOrganization(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    emailList: Array<string>,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/people',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      body: emailList,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Generate a CSV file listing the people of an organization
   * Generate a CSV file containing the `name`, `email`, `lastLogin`, and `lastAnalysis` of each person of the organization
   *
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @returns string Successful operation
   * @throws ApiError
   */
  public static listPeopleFromOrganizationCsv(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
  ): CancelablePromise<string> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/peopleCsv',
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
      },
    });
  }

  /**
   * Get permission for a user on an organization
   * Get permission for a user on an organization
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param email Email filter
   * @returns PersonPermissionResponse Successful operation
   * @throws ApiError
   */
  public static getUserPermissionOnOrganization(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    email: string,
  ): CancelablePromise<PersonPermissionResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/people/permissions',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      query: {
        'email': email,
      },
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * Remove people from an organization
   * Remove people from an organization
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param removePeopleParameter List of committers/members to remove
   * @returns RemovePeopleResponse Remove people response
   * @throws ApiError
   */
  public static removePeopleFromOrganization(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    removePeopleParameter: RemovePeopleBody,
  ): CancelablePromise<RemovePeopleResponse> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/organizations/{provider}/{remoteOrganizationName}/people/remove',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      body: removePeopleParameter,
      errors: {
        400: `Bad Request`,
        401: `Unauthorized`,
        404: `Not Found`,
        500: `Internal Server Error`,
      },
    });
  }

  /**
   * List people suggestions for an organization
   * List people suggestions for an organization
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @param search Filter the results searching by this string.
   * @returns SuggestedAuthorsResponse List people suggestions response
   * @throws ApiError
   */
  public static peopleSuggestionsForOrganization(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    cursor?: string,
    limit: number = 100,
    search?: string,
  ): CancelablePromise<SuggestedAuthorsResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/people/suggestions',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
      },
      query: {
        'cursor': cursor,
        'limit': limit,
        'search': search,
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
   * List people suggestions for a repository
   * List people suggestions for a repository
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param cursor Cursor to [specify a batch of results to request](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   * @param limit Maximum number of items to return
   * @param search Filter the results searching by this string.
   * @returns RepositorySuggestedAuthorsResponse List people suggestions response
   * @throws ApiError
   */
  public static peopleSuggestionsForRepository(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    cursor?: string,
    limit: number = 100,
    search?: string,
  ): CancelablePromise<RepositorySuggestedAuthorsResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/people/suggestions',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      query: {
        'cursor': cursor,
        'limit': limit,
        'search': search,
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
