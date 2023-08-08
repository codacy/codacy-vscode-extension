/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { PaginationInfo } from './PaginationInfo';
import type { SrmItem } from './SrmItem';

/**
 * Security and risk management item list, sorted by due date descending.
 */
export type SrmItemsResponse = {
  pagination: PaginationInfo;
  data: Array<SrmItem>;
};

