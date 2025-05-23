import * as vscode from 'vscode'
import { exec } from 'child_process'
import Logger from '../common/logger'
import * as path from 'path'
import { Run } from 'sarif'
import { CodacyError } from '../common/utils'

// Set a larger buffer size (10MB)
const MAX_BUFFER_SIZE = 1024 * 1024 * 10

const sanitizeFilePath = (workspaceRoot: string, filePath?: string): string => {
  // Remove any shell metacharacters
  const safePath = filePath?.replace(/[;&|`$]/g, '') || ''

  return path.relative(workspaceRoot, safePath) || ''
}

export async function runCodacyAnalyze(filePath?: string) {
  try {
    // Get workspace folder (to solve: mkdir error)
    const workspaceFolders = vscode.workspace.workspaceFolders
    const cliVersion = vscode.workspace.getConfiguration().get('codacy.cli.cliVersion')
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('No workspace folder found')
    }
    const workspaceRoot = workspaceFolders[0].uri.fsPath

    // If filePath is provided, make it relative to workspace root
    const relativeFilePath = sanitizeFilePath(workspaceRoot, filePath)

    // Construct the command
    const command = `${cliVersion ? `CODACY_CLI_V2_VERSION=${cliVersion}` : ''} .codacy/cli.sh analyze --format sarif ${
      relativeFilePath || ''
    }`

    Logger.debug(`Running Codacy CLI V2 analyze command for ${relativeFilePath || 'entire workspace'}...`)

    return new Promise<ProcessedSarifResult[]>((resolve, reject) => {
      // Execute in workspace directory with increased maxBuffer
      exec(
        command,
        {
          cwd: workspaceRoot,
          maxBuffer: MAX_BUFFER_SIZE, // To solve: stdout maxBuffer exceeded
        },
        (error, stdout, stderr) => {
          if (error) {
            reject(new CodacyError('Failed to run Codacy analysis', error, 'CLI'))
            return
          }

          if (stderr && !stdout) {
            Logger.warn(`Codacy CLI V2 warnings: ${stderr}`)
            return
          }

          const jsonMatch = /(\{[\s\S]*\})/.exec(stdout)
          const sarifResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null

          const results: ProcessedSarifResult[] =
            sarifResult && 'runs' in sarifResult ? processSarifResults(sarifResult.runs) : []

          Logger.debug(
            `Codacy CLI V2 analysis completed for ${filePath || 'entire workspace'} with ${results.length} results.`
          )

          resolve(results)
        }
      )
    })
  } catch (error: unknown) {
    if (error instanceof CodacyError) {
      throw error
    } else {
      throw new CodacyError('Failed to run Codacy analysis', error as Error, 'CLI')
    }
  }
}

const processSarifResults = (runs: Run[]) => {
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
