/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { PullRequestOwner } from './PullRequestOwner';

export type PullRequest = {
  id: number;
  number: number;
  updated: string;
  /**
   * Pull request status
   */
  status: string;
  repository: string;
  title: string;
  owner: PullRequestOwner;
  originBranch?: string;
  targetBranch?: string;
  /**
   * URL to the pull request on the Git provider
   */
  gitHref: string;
};

