/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CoveragePullRequestCommitDetail } from './CoveragePullRequestCommitDetail';

/**
 * Status and details about the coverage reports uploaded for the head commit
 * and common ancestor commit of the pull request.
 *
 */
export type CoveragePullRequestResponse = {
  data: {
    headCommit: CoveragePullRequestCommitDetail;
    commonAncestorCommit: CoveragePullRequestCommitDetail;
    /**
     * Deprecated - use [head Commit] instead
     */
    origin: CoveragePullRequestCommitDetail;
    /**
     * Deprecated - use [commonAncestorCommit] instead
     */
    target: CoveragePullRequestCommitDetail;
  };
};

