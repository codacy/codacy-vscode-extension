/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CodacyProduct } from './CodacyProduct';
import type { OrganizationBillingPlan } from './OrganizationBillingPlan';
import type { ProductPaywall } from './ProductPaywall';

export type ProductSubscription = {
  product: CodacyProduct;
  plan?: OrganizationBillingPlan;
  paywall?: ProductPaywall;
};

