/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ParameterList } from './ParameterList';
import type { PatternDetails } from './PatternDetails';

/**
 * Code pattern that a Codacy tool can use to find issues
 */
export type Pattern = (PatternDetails & {
  /**
   * Short description of the code pattern
   */
  description?: string;
  /**
   * Full description of the code pattern, in CommonMark
   */
  explanation?: string;
  /**
   * True if the code pattern is on by default for new repositories
   */
  enabled: boolean;
  /**
   * List of languages that the code pattern supports
   */
  languages?: Array<string>;
  /**
   * Average time to fix an issue detected by the code pattern, in minutes
   */
  timeToFix?: number;
  parameters: ParameterList;
});

