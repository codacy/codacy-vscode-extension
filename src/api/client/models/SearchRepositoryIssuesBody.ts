/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { SeverityLevel } from './SeverityLevel';

/**
 * Search parameters to filter the list of issues in a repository
 */
export type SearchRepositoryIssuesBody = {
  /**
   * Name of a [repository branch enabled on Codacy](https://docs.codacy.com/repositories-configure/managing-branches/),
   * as returned by the endpoint [listRepositoryBranches](#listrepositorybranches).
   * By default, uses the main branch defined on the Codacy repository settings.
   *
   */
  branchName?: string;
  /**
   * Set of code pattern identifiers, as returned by the endpoint [listPatterns](#listpatterns)
   */
  patternIds?: Array<string>;
  /**
   * Set of language names, without spaces
   */
  languages?: Array<string>;
  /**
   * Set of issue categories
   */
  categories?: Array<string>;
  /**
   * Set of issue severity levels
   */
  levels?: Array<SeverityLevel>;
  /**
   * Set of commit author email addresses
   */
  authorEmails?: Array<string>;
};

