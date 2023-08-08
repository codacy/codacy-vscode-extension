/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { PaginationInfo } from './PaginationInfo';
import type { SecurityManager } from './SecurityManager';

/**
 * Security manager list sorted by organization admin status first and then alphabetically
 */
export type SecurityManagersResponse = {
  pagination: PaginationInfo;
  data: Array<SecurityManager>;
};

