/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Representation of a person that belongs to an organization
 */
export type Person = {
  /**
   * The name of the person
   */
  name?: string;
  /**
   * [deprecated: use emails instead] The email of the person
   */
  email: string;
  /**
   * The emails of the person
   */
  emails: Array<string>;
  /**
   * User ID internal to Codacy.
   */
  userId?: number;
  /**
   * Commit author ID
   */
  commiterId?: number;
  lastLogin?: string;
  /**
   * Date and time when Codacy last analyzed a commit from this person.
   */
  lastAnalysis?: string;
};

