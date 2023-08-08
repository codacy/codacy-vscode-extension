/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Billing } from './Billing';
import type { OrganizationProductBillingPlan } from './OrganizationProductBillingPlan';
import type { PaymentProvider } from './PaymentProvider';
import type { Tax } from './Tax';

export type OrganizationBillingInformation = {
  numberOfSeats: number;
  numberOfPurchasedSeats: number;
  /**
   * Deprecated, use `subscriptions.plan` instead
   */
  paymentPlan: Billing;
  paymentGateway?: PaymentProvider;
  /**
   * Final price paid in cents, containing all taxes if there are any. For example, 12020 represents $120.20.
   */
  priceInCents: number;
  /**
   * Final price paid per seat in cents, containing all taxes if there are any. For example, 1405 represents $14.05.
   */
  pricePerSeatInCents?: number;
  /**
   * Next payment date for the plan. This field is empty for plans that don't renew automatically.
   */
  nextPaymentDate?: string;
  invoiceDetails?: {
    /**
     * Invoice address
     */
    address: string;
    /**
     * Invoice email address
     */
    email: string;
  };
  /**
   * Taxes included in the final price priceInCents.
   */
  taxes: Array<Tax>;
  subscriptions: Array<OrganizationProductBillingPlan>;
};

