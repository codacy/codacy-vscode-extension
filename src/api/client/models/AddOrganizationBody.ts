/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CodacyProduct } from './CodacyProduct';
import type { OrganizationType } from './OrganizationType';
import type { Provider } from './Provider';

export type AddOrganizationBody = {
  provider: Provider;
  remoteIdentifier: string;
  name: string;
  type: OrganizationType;
  products?: Array<CodacyProduct>;
};

