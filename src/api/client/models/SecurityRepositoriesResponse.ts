/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { PaginationInfo } from './PaginationInfo';
import type { RepositorySummary } from './RepositorySummary';

/**
 * List of repositories that have security issues.
 */
export type SecurityRepositoriesResponse = {
  pagination: PaginationInfo;
  data: Array<RepositorySummary>;
};

