/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { LeaveOrgProblem } from './LeaveOrgProblem';

/**
 * Informs if the user can leave the organization and if not, why.
 */
export type LeaveOrgCheckResult = {
  /**
   * True if user can leave the organization
   */
  canLeave: boolean;
  message: string;
  reason?: LeaveOrgProblem;
};

