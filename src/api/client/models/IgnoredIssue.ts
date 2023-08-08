/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CommitReference } from './CommitReference';
import type { PatternDetails } from './PatternDetails';
import type { ToolReference } from './ToolReference';

/**
 * Ignored issue details including the commit that originated the issue
 */
export type IgnoredIssue = {
  /**
   * ID of the Issue
   */
  issueId: string;
  /**
   * Path of the file where the issue was found and ignored
   */
  filePath: string;
  fileId?: number;
  patternInfo: PatternDetails;
  toolInfo: ToolReference;
  /**
   * Line where the issue was found
   */
  lineNumber?: number;
  /**
   * Detailed cause of the ignored issue
   */
  message: string;
  /**
   * Language of the file where the ignored issue was found
   */
  language: string;
  /**
   * Contents of the line where the ignored issue was found
   */
  lineText: string;
  commitInfo?: CommitReference;
};

