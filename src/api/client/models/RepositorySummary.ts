/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Provider } from './Provider';

/**
 * Essential information to describe a repository.
 */
export type RepositorySummary = {
  /**
   * Codacy identifier for this repository.
   */
  repositoryId?: number;
  provider: Provider;
  /**
   * Name of the organization that owns the repository.
   */
  owner: string;
  /**
   * Name of the repository.
   */
  name: string;
};

