/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { PullRequestCoverageReport } from './PullRequestCoverageReport';

/**
 * Status and details of the coverage reports received for a pull request commit
 */
export type CoveragePullRequestCommitDetail = {
  commitId: number;
  commitSha: string;
  reports: Array<PullRequestCoverageReport>;
};

