/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type DeprecatedRepositoryQualitySettings = {
  /**
   * The repository will be considered unhealthy if the percentage of issues is over this threshold
   */
  issueThreshold?: number;
  /**
   * The repository will be considered unhealthy if the percentage of duplication of files is over this threshold
   */
  duplicationThreshold?: number;
  /**
   * The repository will be considered unhealthy if the coverage percentage is under this threshold
   */
  coverageThreshold?: number;
  /**
   * The repository will be considered unhealthy if the percentage of complexity of files is over this threshold
   */
  complexityThreshold?: number;
  /**
   * A file in this repository will be considered duplicated when the number of cloned blocks is over this threshold
   */
  fileDuplicationThreshold?: number;
  /**
   * A file in this repository will be considered complex when its complexity value is over this threshold
   */
  fileComplexityThreshold?: number;
};

