/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Count } from './Count';
import type { PatternsCount } from './PatternsCount';

/**
 * Overview of the issues in a repository
 */
export type IssuesOverviewCounts = {
  /**
   * Number of issues per category
   */
  categories: Array<Count>;
  /**
   * Number of issues per language
   */
  languages: Array<Count>;
  /**
   * Number of issues per severity level
   */
  levels: Array<Count>;
  /**
   * Number of issues per code pattern
   */
  patterns: Array<PatternsCount>;
  /**
   * Number of issues per commit author
   */
  authors: Array<Count>;
};

