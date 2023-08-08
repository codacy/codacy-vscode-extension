/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { JoinMode } from './JoinMode';
import type { JoinStatus } from './JoinStatus';
import type { OrganizationType } from './OrganizationType';
import type { Provider } from './Provider';
import type { UserRole } from './UserRole';

export type Organization = {
  identifier?: number;
  remoteIdentifier: string;
  name: string;
  avatar?: string;
  created?: string;
  provider: Provider;
  joinMode?: JoinMode;
  type: OrganizationType;
  joinStatus?: JoinStatus;
  userRole?: UserRole;
};

