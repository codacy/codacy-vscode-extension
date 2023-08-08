/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type User = {
  id: number;
  name?: string;
  mainEmail: string;
  otherEmails: Array<string>;
  isAdmin: boolean;
  isActive: boolean;
  created: string;
  intercomHash?: string;
  shouldDoClientQualification?: boolean;
};

