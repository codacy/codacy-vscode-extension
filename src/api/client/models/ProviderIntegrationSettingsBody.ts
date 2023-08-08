/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Default settings for Git provider integrations
 */
export type ProviderIntegrationSettingsBody = {
  /**
   * Toggle the feature "Status checks"
   */
  commitStatus: boolean;
  /**
   * Toggle the feature "Issue annotations"
   */
  pullRequestComment: boolean;
  /**
   * Toggle the feature "Issue summaries"
   */
  pullRequestSummary: boolean;
  /**
   * Toggle the feature "Coverage summary" (GitHub only)
   */
  coverageSummary?: boolean;
  /**
   * Toggle the feature "Suggested fixes" (GitHub only)
   */
  suggestions?: boolean;
  /**
   * Toggle the feature "AI-enhanced comments". If "Suggested fixes" (GitHub only) is also enabled, then the AI-enhanced comments also provide suggested fixes. This is an experimental feature.
   */
  aiEnhancedComments: boolean;
};

