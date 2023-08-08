/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Reason for an analysis result for a quality gate
 */
export type AnalysisResultReason = {
  /**
   * Name of the quality gate
   */
  gate: string;
  /**
   * Threshold value configured for the quality gate
   */
  expected: number;
  /**
   * True if the value passes the quality gate
   */
  isUpToStandards: boolean;
};

