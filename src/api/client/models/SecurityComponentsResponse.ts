/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { SecurityComponent } from './SecurityComponent';

/**
 * Aggregate of various metrics.
 *
 */
export type SecurityComponentsResponse = {
  items: Array<{
    repositories: SecurityComponent;
    infrastructure: SecurityComponent;
    people: SecurityComponent;
    tickets: SecurityComponent;
  }>;
};

