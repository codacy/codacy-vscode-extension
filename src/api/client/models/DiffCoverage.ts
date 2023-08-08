/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type DiffCoverage = {
  /**
   * Coverage value of the lines added or modified by the pull request
   */
  value?: number;
  /**
   * Number of covered lines from the lines added or modified by the pull request
   */
  coveredLines?: number;
  /**
   * Number of coverable lines from the lines added or modified by the pull request
   */
  coverableLines?: number;
  /**
   * Rationale for diffCoverage value interpretation
   */
  cause: 'ValueIsPresent' | 'NoCoverableLines' | 'MissingRequirements';
};

