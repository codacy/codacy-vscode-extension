/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CategoryIssues } from './CategoryIssues';

export type CommitAnalysisStats = {
  repositoryId: number;
  commitId: number;
  numberIssues: number;
  numberLoc: number;
  issuesPerCategory: Array<CategoryIssues>;
  issuePercentage: number;
  totalComplexity?: number;
  numberComplexFiles?: number;
  complexFilesPercentage?: number;
  filesChangedToIncreaseComplexity?: number;
  numberDuplicatedLines?: number;
  duplicationPercentage?: number;
  /**
   * Test coverage percentage, truncated. Present only if a coverage report was processed for this commit.
   */
  coveragePercentage?: number;
  /**
   * Test coverage percentage. Present only if a coverage report was processed for this commit.
   */
  coveragePercentageWithDecimals?: number;
  numberFilesUncovered?: number;
  techDebt: number;
  totalFilesAdded: number;
  totalFilesRemoved: number;
  totalFilesChanged: number;
  commitTimestamp: string;
  commitAuthorName: string;
  commitShortUUID: string;
};

