/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Branch } from './Branch';
import type { Commit } from './Commit';

export type CommitWithBranches = (Commit & {
  /**
   * List of branches containing the commit
   */
  branches?: Array<Branch>;
});

