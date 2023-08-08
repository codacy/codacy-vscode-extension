/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Security and risk management item of an organization.
 */
export type SrmItem = {
  /**
   * Item ID internal to Codacy.
   */
  id: string;
  /**
   * Source platform of the item's underlying issue
   */
  itemSource: 'Codacy' | 'Jira';
  /**
   * Original source item ID.
   */
  itemSourceId: string;
  /**
   * Human-readable title of the item.
   */
  title: string;
  repository?: string;
  openedAt: string;
  closedAt?: string;
  dueAt: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Overdue' | 'OnTrack' | 'DueSoon' | 'ClosedOnTime' | 'ClosedLate';
  /**
   * Link to the item's underlying issue
   */
  htmlUrl?: string;
  /**
   * Jira project key of the item's underlying issue
   */
  projectKey?: string;
};

