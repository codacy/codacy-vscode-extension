/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { QualityGate } from './QualityGate';

export type UpdateGatePolicyBody = {
  /**
   * Name of the gate policy
   */
  gatePolicyName?: string;
  /**
   * True if the gate policy is the default for the organization
   */
  isDefault?: boolean;
  settings?: QualityGate;
};

