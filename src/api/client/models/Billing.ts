/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type Billing = {
  /**
   * Deprecated, use subscriptions.plan.isPremium instead.
   */
  isPremium: boolean;
  model: 'Auto' | 'Manual';
  /**
   * Deprecated, use subscriptions.plan.code instead.
   */
  code?: string;
  monthly?: boolean;
  price?: number;
  pricedPerUser?: boolean;
};

