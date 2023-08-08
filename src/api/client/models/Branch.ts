/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type Branch = {
  id: number;
  name: string;
  isDefault: boolean;
  isEnabled: boolean;
  lastUpdated?: string;
  branchType: 'Branch' | 'PullRequest';
  lastCommit?: string;
};

