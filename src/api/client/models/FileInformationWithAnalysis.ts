/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { FileCoverageAnalysis } from './FileCoverageAnalysis';
import type { FileMetadata } from './FileMetadata';
import type { FileMetrics } from './FileMetrics';

export type FileInformationWithAnalysis = {
  file: FileMetadata;
  metrics?: FileMetrics;
  coverage?: FileCoverageAnalysis;
};

