/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type BuildServerAnalysisSettingResponse = {
  /**
   * If true, Codacy waits for your build server to upload the results of the local analysis before resuming the analysis of your commits.
   * If false, Codacy analyzes your commits directly on its cloud infrastructure.
   *
   */
  buildServerAnalysisSetting: boolean;
};

