/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Details of a Jira integration for the security and risk management feature.
 */
export type JiraIntegration = {
  /**
   * Codacy organization ID
   */
  organization_id: number;
  /**
   * Jira cloud ID of the organization
   */
  instance_id: string;
  /**
   * Name of the Jira instance that Codacy has access to
   */
  instance_name: string;
  created_at: string;
  updated_at: string;
};

