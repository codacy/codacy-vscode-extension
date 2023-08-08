/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Filters where to fetch the repositories from:
 * * `AllSynced` - All organization's repositories in Codacy. Requires Admin access
 * * `NotSynced` - All organization's repositories fetched from provider.
 * * `Synced` - All organization's repositories that the user has access.
 *
 */
export type RepositoryFilter = 'Synced' | 'NotSynced' | 'AllSynced';
