/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { PaginationInfo } from './PaginationInfo';
import type { RepositoryIdentification } from './RepositoryIdentification';

export type CodingStandardRepositoriesListResponse = {
  /**
   * List of repositories using a coding standard
   */
  data: Array<RepositoryIdentification>;
  pagination?: PaginationInfo;
};

