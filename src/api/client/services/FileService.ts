/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CodeBlockLineListResponse } from '../models/CodeBlockLineListResponse';
import type { FileExtensionsBody } from '../models/FileExtensionsBody';
import type { FileExtensionsResponse } from '../models/FileExtensionsResponse';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class FileService {

  /**
   * Get the list of supported file extensions associated with each language in a repository
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @returns FileExtensionsResponse Successful operation
   * @throws ApiError
   */
  public static getFileExtensionsSettings(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
  ): CancelablePromise<FileExtensionsResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/settings/file-extensions',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
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
   * Update the custom file extensions for a repository
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param fileExtensionsBody
   * @returns void
   * @throws ApiError
   */
  public static patchFileExtensionsSettings(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    fileExtensionsBody: FileExtensionsBody,
  ): CancelablePromise<void> {
    return __request(OpenAPI, {
      method: 'PATCH',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/settings/file-extensions',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
      },
      body: fileExtensionsBody,
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
   * Returns a code block from a file
   * @param provider Git provider
   * @param remoteOrganizationName Organization name on the Git provider
   * @param repositoryName Repository name on the Git provider organization
   * @param fileId Identifier of a file in a specific commit
   * @param startLine Line number where the code block starts
   * @param endLine Line number where the code block ends
   * @returns CodeBlockLineListResponse Successful operation
   * @throws ApiError
   */
  public static getCodeBlock(
    provider: 'bb' | 'gh' | 'gl',
    remoteOrganizationName: string,
    repositoryName: string,
    fileId: number,
    startLine?: number,
    endLine?: number,
  ): CancelablePromise<CodeBlockLineListResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/organizations/{provider}/{remoteOrganizationName}/repositories/{repositoryName}/files/{fileId}/source',
      path: {
        'provider': provider,
        'remoteOrganizationName': remoteOrganizationName,
        'repositoryName': repositoryName,
        'fileId': fileId,
      },
      query: {
        'startLine': startLine,
        'endLine': endLine,
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

}
