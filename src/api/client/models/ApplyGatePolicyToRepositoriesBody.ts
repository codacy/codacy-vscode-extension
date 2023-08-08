/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Names of the repositories to link or unlink from a gate policy
 */
export type ApplyGatePolicyToRepositoriesBody = {
  /**
   * Names of the repositories to link to a gate policy
   */
  link: Array<string>;
  /**
   * Names of the repositories to unlink from a gate policy
   */
  unlink: Array<string>;
};

