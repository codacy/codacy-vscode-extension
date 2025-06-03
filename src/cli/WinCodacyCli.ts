import { ProcessedSarifResult } from '.'
import { CodacyCli } from './CodacyCli'
import * as vscode from 'vscode'

const NOT_SUPPORTED = 'CLI on Windows is not supported without WSL.'

export class WinCodacyCli extends CodacyCli {
  constructor(rootPath: string, provider?: string, organization?: string, repository?: string) {
    vscode.commands.executeCommand('setContext', 'codacy:canInstallCLI', false)
    super(rootPath, provider, organization, repository)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public preflightCodacyCli(_autoInstall: boolean): Promise<void> {
    throw new Error(NOT_SUPPORTED)
  }

  public install(): Promise<void> {
    throw new Error(NOT_SUPPORTED)
  }
  public installDependencies(): Promise<void> {
    throw new Error(NOT_SUPPORTED)
  }
  public update(): Promise<void> {
    throw new Error(NOT_SUPPORTED)
  }
  public initialize(): Promise<void> {
    throw new Error(NOT_SUPPORTED)
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public analyze(_options: { file?: string; tool?: string }): Promise<ProcessedSarifResult[] | null> {
    throw new Error(NOT_SUPPORTED)
  }
}
