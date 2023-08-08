/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { FileDeltaAnalysis } from './FileDeltaAnalysis';
import type { PaginationInfo } from './PaginationInfo';

/**
 * List of files with analysis results changes between two commits
 */
export type FileAnalysisListResponse = {
  pagination?: PaginationInfo;
  data?: Array<FileDeltaAnalysis>;
};

