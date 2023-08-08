/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { AddedState } from './AddedState';
import type { Badges } from './Badges';
import type { Branch } from './Branch';
import type { Permission } from './Permission';
import type { RepositoryProblem } from './RepositoryProblem';
import type { RepositorySummary } from './RepositorySummary';
import type { Visibility } from './Visibility';

export type Repository = (RepositorySummary & {
  /**
   * Full path of the repository on the Git provider
   */
  fullPath?: string;
  visibility: Visibility;
  /**
   * Unique identifier of the repository on the Git provider
   */
  remoteIdentifier?: string;
  /**
   * Timestamp when the repository was last updated, [depending on the Git provider](https://docs.codacy.com/organizations/organization-overview/#last-updated-repositories)
   */
  lastUpdated?: string;
  permission?: Permission;
  problems: Array<RepositoryProblem>;
  /**
   * List of the languages in the repository
   */
  languages: Array<string>;
  defaultBranch?: Branch;
  badges?: Badges;
  /**
   * Coding Standard identifier
   */
  codingStandardId?: number;
  /**
   * Coding Standard name
   */
  codingStandardName?: string;
  addedState: AddedState;
  /**
   * Identifier of the gate policy the repository is following. If not defined, the repository doesn't follow a gate policy.
   */
  gatePolicyId?: number;
  /**
   * Name of the gate policy the repository is following. Present only if the gatePolicyId is defined.
   */
  gatePolicyName?: string;
});

