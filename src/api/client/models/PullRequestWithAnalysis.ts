/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { PullRequest } from './PullRequest';
import type { PullRequestCoverage } from './PullRequestCoverage';

export type PullRequestWithAnalysis = {
  /**
   * True if metrics are at or above gate thresholds
   */
  isUpToStandards?: boolean;
  isAnalysing: boolean;
  pullRequest: PullRequest;
  /**
   * Number of issues introduced by the pull request
   */
  newIssues?: number;
  /**
   * Number of issues fixed by the pull request
   */
  fixedIssues?: number;
  /**
   * Difference in cyclomatic complexity introduced by the pull request
   */
  deltaComplexity?: number;
  /**
   * Difference in number of duplicated blocks of code introduced by the pull request
   */
  deltaClonesCount?: number;
  /**
   * Deprecated, use the coverage object instead.
   */
  deltaCoverageWithDecimals?: number;
  /**
   * Deprecated, use the coverage object instead.
   */
  deltaCoverage?: number;
  /**
   * Deprecated, use the coverage object instead.
   */
  diffCoverage?: number;
  /**
   * Coverage information for a pull request coverage
   */
  coverage?: PullRequestCoverage;
};

