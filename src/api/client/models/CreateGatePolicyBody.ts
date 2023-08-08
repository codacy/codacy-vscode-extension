/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { QualityGate } from './QualityGate';

/**
 * Details of a new gate policy
 */
export type CreateGatePolicyBody = {
  /**
   * Name of the gate policy
   */
  gatePolicyName: string;
  isDefault?: boolean;
  settings?: QualityGate;
};

