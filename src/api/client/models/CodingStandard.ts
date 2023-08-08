/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CodingStandardMeta } from './CodingStandardMeta';

/**
 * Coding standard for an organization
 */
export type CodingStandard = {
  /**
   * Identifier of the coding standard
   */
  id: number;
  /**
   * Name of the coding standard
   */
  name: string;
  /**
   * True if the coding standard is a draft
   */
  isDraft: boolean;
  /**
   * True if the coding standard is the default for the organization
   */
  isDefault: boolean;
  /**
   * List of programming languages supported by the coding standard
   */
  languages: Array<string>;
  meta: CodingStandardMeta;
};

