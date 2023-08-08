/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Delta quality metrics for a commit
 */
export type CommitDeltaStatistics = {
  /**
   * Unique identifier of the commit
   */
  commitUuid: string;
  /**
   * Number of issues introduced by the commit
   */
  newIssues: number;
  /**
   * Number of issues fixed by the commit
   */
  fixedIssues: number;
  /**
   * Difference in cyclomatic complexity when compared to the previous commit
   */
  deltaComplexity?: number;
  /**
   * Difference in code coverage percentage when compared to the previous commit
   */
  deltaCoverage?: number;
  /**
   * Difference in code coverage with decimals percentage when compared to the previous commit
   */
  deltaCoverageWithDecimals?: number;
  /**
   * Difference in number of duplicated blocks of code when compared to the previous commit
   */
  deltaClonesCount?: number;
  /**
   * True if the commit was already analyzed by Codacy
   */
  analyzed: boolean;
};

