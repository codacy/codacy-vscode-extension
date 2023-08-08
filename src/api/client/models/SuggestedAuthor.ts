/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ProjectCommitStat } from './ProjectCommitStat';

export type SuggestedAuthor = {
  commitEmail: string;
  totalProjects: number;
  totalCommits: number;
  lastCommit?: string;
  projectCommitStats: Array<ProjectCommitStat>;
};

