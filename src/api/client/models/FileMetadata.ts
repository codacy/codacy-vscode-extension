/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Metadata for a file in a repository
 */
export type FileMetadata = {
  commitId: number;
  /**
   * Commit SHA
   */
  commitSha: string;
  /**
   * Identifier for file in any branch of a specific commit
   */
  fileId: number;
  /**
   * Identifier for file
   */
  fileDataId: number;
  /**
   * Relative path of the file in the repository
   */
  path: string;
  /**
   * Language of the file
   */
  language: string;
  /**
   * URL to the commit on the Git provider
   */
  gitProviderUrl: string;
};

