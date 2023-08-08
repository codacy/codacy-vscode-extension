/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { FileDeltaCoverageAnalysis } from './FileDeltaCoverageAnalysis';
import type { FileDeltaQualityAnalysis } from './FileDeltaQualityAnalysis';
import type { FileMetadata } from './FileMetadata';

/**
 * File with analysis results changes between two commits
 */
export type FileDeltaAnalysis = {
  file: FileMetadata;
  coverage?: FileDeltaCoverageAnalysis;
  quality?: FileDeltaQualityAnalysis;
  /**
   * Original analysis results for the file
   */
  comparedWithCommit?: {
    commitId: number;
    coverage?: {
      /**
       * Total coverage of the commit
       */
      totalCoverage?: number;
    };
  };
};

