/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type Coverage = {
  filesUncovered?: number;
  filesWithLowCoverage?: number;
  /**
   * Test coverage percentage, truncated. Present only if a coverage report was processed for the most recent commit on the relevant branch.
   */
  coveragePercentage?: number;
  /**
   * Test coverage percentage. Present only if a coverage report was processed for the most recent commit on the relevant branch.
   */
  coveragePercentageWithDecimals?: number;
  numberTotalFiles?: number;
};

