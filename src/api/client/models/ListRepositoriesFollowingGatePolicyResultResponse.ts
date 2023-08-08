/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { PaginationInfo } from './PaginationInfo';
import type { RepositoryIdentification } from './RepositoryIdentification';

export type ListRepositoriesFollowingGatePolicyResultResponse = {
  /**
   * List of repositories following a gate policy
   */
  data: Array<RepositoryIdentification>;
  pagination?: PaginationInfo;
};

