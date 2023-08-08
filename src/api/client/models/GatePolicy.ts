/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { GatePolicyMeta } from './GatePolicyMeta';
import type { QualityGate } from './QualityGate';

/**
 * Details of the gate policy
 */
export type GatePolicy = {
  /**
   * Identifier of the gate policy
   */
  id: number;
  /**
   * Name of the gate policy
   */
  name: string;
  /**
   * True if the gate policy is the default for the organization
   */
  isDefault: boolean;
  /**
   * True if the quality gates of the gate policy cannot be changed
   */
  readOnly: boolean;
  settings: QualityGate;
  meta: GatePolicyMeta;
};

