/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CommitIdentification } from './CommitIdentification';

/**
 * Details of the commit that introduced the issue or null if the issue was introduced in a commit that Codacy didn't analyze
 */
export type CommitReference = (CommitIdentification & {
  /**
   * Email address of the author of the commit
   */
  commiter?: string;
  /**
   * Name of the author of the commit
   */
  commiterName?: string;
  /**
   * Time and date of the commit
   */
  timestamp?: string;
});

