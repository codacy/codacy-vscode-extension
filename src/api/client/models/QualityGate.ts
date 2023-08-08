/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { SeverityLevel } from './SeverityLevel';

export type QualityGate = {
  /**
   * The quality gate will fail if there are new issues of the specified severity over this threshold (if no severity is specified all severity levels are considered). This value cannot be negative
   */
  issueThreshold?: {
    threshold: number;
    minimumSeverity?: SeverityLevel;
  };
  /**
   * The quality gate will fail if the number of new security issues is over this threshold. This value cannot be negative
   */
  securityIssueThreshold?: number;
  /**
   * The quality gate will fail if there are new duplicated blocks over this threshold
   */
  duplicationThreshold?: number;
  /**
   * [deprecated: use coverageThresholdWithDecimals instead] The quality gate will fail if coverage percentage varies less than this threshold. This value should be at most 1
   */
  coverageThreshold?: number;
  /**
   * The quality gate will fail if coverage percentage varies less than this threshold. This value should be at most 1.00
   */
  coverageThresholdWithDecimals?: number;
  /**
   * The quality gate will fail if diff coverage is under this threshold. This value should be at least 0 and at most 100
   */
  diffCoverageThreshold?: number;
  /**
   * The quality gate will fail if the complexity value is over this threshold. This value cannot be negative
   */
  complexityThreshold?: number;
};

