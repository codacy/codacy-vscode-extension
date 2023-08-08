/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * File with analysis information
 */
export type FileWithAnalysisInfo = {
  /**
   * Identifier of the file in a specific branch and commit
   */
  fileId: number;
  /**
   * Identifier for the branch the file belongs to
   */
  branchId: number;
  /**
   * Relative path of the file in the repository
   */
  path: string;
  /**
   * Number of issues in the file
   */
  totalIssues: number;
  /**
   * Complexity level of the file
   */
  complexity?: number;
  /**
   * Quality grade of the file as a number between 100 (highest grade) and 0 (lowest grade)
   */
  grade: number;
  /**
   * Quality grade of the file as a letter between A (highest grade) and F (lowest grade)
   */
  gradeLetter: string;
  /**
   * [deprecated: use coverageWithDecimals instead] Test coverage percentage of the file
   */
  coverage?: number;
  /**
   * Test coverage percentage of the file with decimals
   */
  coverageWithDecimals?: number;
  /**
   * Number of duplicated lines in the file
   */
  duplication?: number;
  /**
   * Lines of code in the file
   */
  linesOfCode?: number;
  /**
   * Coverable lines of code in the file
   */
  sourceLinesOfCode?: number;
  /**
   * Number of methods in the file
   */
  numberOfMethods: number;
  /**
   * Number of cloned blocks of code in the file
   */
  numberOfClones?: number;
};

