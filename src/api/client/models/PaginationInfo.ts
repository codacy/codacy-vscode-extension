/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Cursor-based pagination information to obtain more items
 */
export type PaginationInfo = {
  /**
   * Cursor to [request the next batch of results](https://docs.codacy.com/codacy-api/using-the-codacy-api/#using-pagination)
   */
  cursor?: string;
  /**
   * Maximum number of items returned
   */
  limit?: number;
  /**
   * Total number of items returned
   */
  total?: number;
};

