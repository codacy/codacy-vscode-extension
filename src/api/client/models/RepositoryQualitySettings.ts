/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type RepositoryQualitySettings = {
  /**
   * The repository will be considered unhealthy if the percentage of issues is over this threshold
   */
  maxIssuePercentage?: number;
  /**
   * The repository will be considered unhealthy if the percentage of duplication of files is over this threshold
   */
  maxDuplicatedFilesPercentage?: number;
  /**
   * The repository will be considered unhealthy if the coverage percentage is under this threshold
   */
  minCoveragePercentage?: number;
  /**
   * The repository will be considered unhealthy if the percentage of complexity of files is over this threshold
   */
  maxComplexFilesPercentage?: number;
  /**
   * A file in this repository will be considered duplicated when the number of cloned blocks is over this threshold. This value cannot be negative
   */
  fileDuplicationBlockThreshold?: number;
  /**
   * A file in this repository will be considered complex when its complexity value is over this threshold. This value cannot be negative
   */
  fileComplexityValueThreshold?: number;
};

