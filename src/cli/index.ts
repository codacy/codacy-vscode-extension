import * as vscode from 'vscode'
import { CodacyCli } from './CodacyCli'
import { MacCodacyCli } from './MacCodacyCli'
import { LinuxCodacyCli } from './LinuxCodacyCli'
import { WinWSLCodacyCli } from './WinWSLCodacyCli'
import { WinCodacyCli } from './WinCodacyCli'
import { Run } from 'sarif'

import { exec } from 'child_process'

export type CliOptions = {
  provider?: string
  organization?: string
  repository?: string
}

async function execWindowsCmdAsync(command: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(
      command,
      {
        encoding: 'buffer',
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(error)
          return
        }

        if (stderr && !stdout) {
          reject(new Error(stderr.toString('utf16le')))
          return
        }

        resolve({ stdout: stdout.toString('utf16le'), stderr: stderr.toString('utf16le') })
      }
    )
  })
}

export class Cli {
  private static _cliInstance: CodacyCli | null = null

  static async get(options: CliOptions) {
    if (!this.cliInstance) {
      return await this.createInstance(options)
    } else if (
      options.provider !== this.cliInstance.provider ||
      options.organization !== this.cliInstance.organization ||
      options.repository !== this.cliInstance.repository
    ) {
      // If the options have changed, create a new instance
      this.cliInstance = null
      return await this.createInstance(options)
    } else {
      // If the options are the same, return the existing instance
      return this.cliInstance
    }
  }

  private static async createInstance(options: CliOptions) {
    const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ''

    const { provider, organization, repository } = options
    const platform = process.platform

    if (platform === 'darwin') {
      this.cliInstance = new MacCodacyCli(rootPath, provider, organization, repository)
    } else if (platform === 'linux') {
      this.cliInstance = new LinuxCodacyCli(rootPath, provider, organization, repository)
    } else if (platform === 'win32') {
      // is WSL installed?
      const { stdout } = await execWindowsCmdAsync('wsl --status')
      const hasWSL = stdout.includes('Default Distribution')

      this.cliInstance = hasWSL
        ? new WinWSLCodacyCli(rootPath, provider, organization, repository)
        : new WinCodacyCli(rootPath, provider, organization, repository)
    }

    if (!this.cliInstance) {
      throw new Error(`Unsupported platform: ${platform}`)
    }

    // set Cli command if found
    await this.cliInstance.preflightCodacyCli(false)

    return this.cliInstance
  }

  public static get cliInstance() {
    return this._cliInstance
  }

  public static set cliInstance(instance: CodacyCli | null) {
    this._cliInstance = instance
  }
}

export const processSarifResults = (runs: Run[]) => {
  return (
    runs.flatMap((run) => {
      const tool = run.tool.driver.name
      const rules = Object.fromEntries(run.tool.driver.rules?.map((rule) => [rule.id, rule]) || [])

      return (
        run.results?.flatMap((result) => {
          const rule = result.ruleId ? rules[result.ruleId] : null
          const level = result.level || 'error'
          const message = result.message?.text || 'No message provided.'

          return (
            result.locations?.map((location) => {
              const filePath = location.physicalLocation?.artifactLocation?.uri

              return {
                tool,
                rule: rule
                  ? {
                      id: rule.id,
                      name: rule.name,
                      helpUri: rule.helpUri,
                      shortDescription: rule.shortDescription?.text,
                    }
                  : result.ruleId
                    ? { id: result.ruleId }
                    : undefined,
                level,
                message,
                filePath,
                region: location.physicalLocation?.region,
              }
            }) || []
          )
        }) || []
      )
    }) || []
  )
}

export type ProcessedSarifResult = ReturnType<typeof processSarifResults>[number]
