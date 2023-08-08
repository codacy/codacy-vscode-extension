/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Billing } from './Billing';
import type { Membership } from './Membership';
import type { Organization } from './Organization';
import type { OrganizationPaywall } from './OrganizationPaywall';
import type { Paywall } from './Paywall';
import type { Permission } from './Permission';
import type { ProductSubscription } from './ProductSubscription';

export type OrganizationWithMeta = {
  organization: Organization;
  membership: Membership;
  billing?: Billing;
  paywall?: Paywall;
  organizationPayWall?: OrganizationPaywall;
  analysisConfigurationMinimumPermission: Permission;
  subscriptions: Array<ProductSubscription>;
};

