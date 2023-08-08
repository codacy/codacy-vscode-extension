/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { SeverityLevel } from './SeverityLevel';

/**
 * Security and risk management priority mapping
 */
export type SrmPriorityMapping = {
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  criteria: {
    /**
     * Issue category
     */
    category: string;
    severity: SeverityLevel;
  };
  /**
   * Priority mapping creation date
   */
  createdAt?: string;
  /**
   * Priority mapping update date
   */
  updatedAt?: string;
};

