/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CommitWithBranches } from './CommitWithBranches';

/**
 * Status and details of a coverage report
 */
export type CoverageReport = {
  /**
   * Commit SHA that was referenced as the target for this report
   */
  targetCommitSha: string;
  commit?: CommitWithBranches;
  /**
   * Programming language associated with the coverage report
   */
  language?: string;
  /**
   * Report creation date
   */
  createdAt: string;
  /**
   * Coverage status
   */
  status: 'Pending' | 'Processed' | 'CommitNotAnalysed' | 'CommitNotFound' | 'BranchNotEnabled' | 'MissingFinal';
};

