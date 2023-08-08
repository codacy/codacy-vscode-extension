/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ToolReference } from './ToolReference';

/**
 * Codacy tool that can flag patterns/issues on projects
 */
export type Tool = (ToolReference & {
  /**
   * Original tool version used by the Codacy tool wrapper
   */
  version: string;
  /**
   * Tool unique short name, must contain alphanumeric characters only and no spaces
   */
  shortName: string;
  /**
   * Original tool documentation URL
   */
  documentationUrl?: string;
  /**
   * Codacy tool wrapper source code URL
   */
  sourceCodeUrl?: string;
  /**
   * Tool prefix used to ensure pattern names are unique
   */
  prefix?: string;
  /**
   * Tool requires compilation to run
   */
  needsCompilation: boolean;
  /**
   * Tool configuration filename
   */
  configurationFilenames: Array<string>;
  /**
   * Tool description
   */
  description?: string;
  /**
   * Docker image used to launch tool
   */
  dockerImage: string;
  /**
   * List of languages that the tool supports
   */
  languages: Array<string>;
  /**
   * True if the tool is supposed to run on the client's machine and the results sent to Codacy
   */
  clientSide: boolean;
  /**
   * True if the client-side tool runs stand-alone outside of the CLI
   */
  standalone: boolean;
  /**
   * True if the tool is enabled by default for new projects (not required)
   */
  enabledByDefault: boolean;
  /**
   * True if the tool is configurable on Codacy's UI
   */
  configurable: boolean;
});

