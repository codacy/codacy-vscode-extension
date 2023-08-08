/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ApiToken } from './ApiToken';
import type { PaginationInfo } from './PaginationInfo';

/**
 * List of API tokens
 */
export type ApiTokenListResponse = {
  pagination?: PaginationInfo;
  data: Array<ApiToken>;
};

