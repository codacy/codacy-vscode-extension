/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { AnalysisResultReason } from './AnalysisResultReason';
import type { DiffCoverage } from './DiffCoverage';

export type PullRequestCoverage = {
  /**
   * Difference between the coverage of the head commit and common ancestor commit of the pull request
   */
  deltaCoverage?: number;
  /**
   * Coverage of the lines added or modified by the pull request
   */
  diffCoverage?: DiffCoverage;
  /**
   * True if coverage metrics are at or above gate thresholds
   */
  isUpToStandards?: boolean;
  /**
   * Reasons for the results of coverage analysis
   */
  resultReasons?: Array<AnalysisResultReason>;
};

