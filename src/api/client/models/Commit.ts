/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CommitIdentification } from './CommitIdentification';

export type Commit = (CommitIdentification & {
  /**
   * Internal commit identifier
   */
  id: number;
  /**
   * Timestamp when the commit was created
   */
  commitTimestamp: string;
  /**
   * Name of the commit author
   */
  authorName?: string;
  /**
   * Email address of the commit author
   */
  authorEmail?: string;
  /**
   * Commit message
   */
  message?: string;
  /**
   * Timestamp when Codacy started the last analysis of the commit
   */
  startedAnalysis?: string;
  /**
   * Timestamp when Codacy finished the last analysis of the commit
   */
  endedAnalysis?: string;
  /**
   * True if the commit is a merge commit
   */
  isMergeCommit?: boolean;
  /**
   * URL to the commit on the Git provider
   */
  gitHref?: string;
  parents?: Array<string>;
});

