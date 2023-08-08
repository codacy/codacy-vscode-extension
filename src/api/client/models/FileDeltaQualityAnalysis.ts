/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Quality changes for a file between two commits
 */
export type FileDeltaQualityAnalysis = {
  /**
   * Number of issues introduced by the commit
   */
  deltaNewIssues: number;
  /**
   * Number of issues fixed by the commit
   */
  deltaFixedIssues: number;
  /**
   * Difference in cyclomatic complexity introduced by the commit
   */
  deltaComplexity?: number;
  /**
   * Difference in number of duplicated blocks of code introduced by the commit
   */
  deltaClonesCount?: number;
};

