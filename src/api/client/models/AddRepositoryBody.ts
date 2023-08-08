/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Provider } from './Provider';

export type AddRepositoryBody = {
  /**
   * Full path of the repository on the Git provider, starting at the organization. Separate each segment of the path with a slash (/).
   */
  repositoryFullPath: string;
  provider: Provider;
};

