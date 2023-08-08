/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { SecurityDashboardMetrics } from './SecurityDashboardMetrics';

/**
 * Brief security metrics for a security dashboard.
 *
 */
export type SecurityDashboardResponse = {
  items_overdue: SecurityDashboardMetrics;
  items_due_soon: SecurityDashboardMetrics;
  past_sla_misses: SecurityDashboardMetrics;
  past_sla_on_time: SecurityDashboardMetrics;
};

