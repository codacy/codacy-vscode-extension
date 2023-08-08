/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { AnalysisResultReason } from './AnalysisResultReason';

export type CoverageAnalysis = {
  /**
   * Total coverage percentage at the requested commit
   */
  totalCoveragePercentage?: number;
  /**
   * Difference in coverage between two commits, expressed in percentage points
   */
  deltaCoveragePercentage?: number;
  /**
   * True if coverage metrics are at or above gate thresholds
   */
  isUpToStandards?: boolean;
  /**
   * Reasons for the results of coverage analysis
   */
  resultReasons?: Array<AnalysisResultReason>;
};

