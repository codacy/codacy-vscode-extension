/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CommitIssue } from './CommitIssue';
import type { DeltaType } from './DeltaType';

/**
 * Details of an issue that was added or fixed by a commit
 */
export type CommitDeltaIssue = {
  commitIssue: CommitIssue;
  deltaType: DeltaType;
};

