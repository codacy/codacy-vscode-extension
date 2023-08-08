/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CoverageReport } from './CoverageReport';

export type CoverageReportResponse = {
  data: {
    /**
     * True if the Quality evolution chart of the repository includes coverage information
     */
    hasCoverageOverview?: boolean;
    lastReports?: Array<CoverageReport>;
  };
};

