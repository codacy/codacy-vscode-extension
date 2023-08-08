/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CommitDeltaIssue } from './CommitDeltaIssue';
import type { PaginationInfo } from './PaginationInfo';

/**
 * List of issues added or fixed on a commit
 */
export type CommitDeltaIssuesResponse = {
  /**
   * True if Codacy already analyzed the commit
   */
  analyzed: boolean;
  /**
   * List of issues added or fixed on a commit or an empty list if Codacy didn't analyze the commit yet.
   */
  data: Array<CommitDeltaIssue>;
  pagination?: PaginationInfo;
};

