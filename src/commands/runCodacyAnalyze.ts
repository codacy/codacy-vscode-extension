import * as vscode from 'vscode'
import { exec } from 'child_process'
import Logger from '../common/logger'
import * as path from 'path'

// Set a larger buffer size (10MB)
const MAX_BUFFER_SIZE = 1024 * 1024 * 10

export async function runCodacyAnalyze(filePath?: string) {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Running Codacy Analysis...',
      cancellable: false,
    },
    async () => {
      try {
        // Get workspace folder (to solve: mkdir error)
        const workspaceFolders = vscode.workspace.workspaceFolders
        if (!workspaceFolders || workspaceFolders.length === 0) {
          throw new Error('No workspace folder found')
        }
        const workspaceRoot = workspaceFolders[0].uri.fsPath

        // If filePath is provided, make it relative to workspace root
        const relativeFilePath = filePath ? path.relative(workspaceRoot, filePath) : undefined

        // Construct the command
        const command = `codacy-cli analyze -t eslint --format sarif ${relativeFilePath || ''}`

        Logger.appendLine(`Running Codacy CLI V2 analyze command for ${relativeFilePath || 'entire workspace'}...`)

        return new Promise<string>((resolve, reject) => {
          // Execute in workspace directory with increased maxBuffer
          exec(
            command,
            {
              cwd: workspaceRoot,
              maxBuffer: MAX_BUFFER_SIZE, // To solve: stdout maxBuffer exceeded
            },
            (error, stdout, stderr) => {
              if (error) {
                Logger.error(`Error executing Codacy CLI V2: ${error.message}`)
                vscode.window.showErrorMessage(`Failed to run Codacy analysis: ${error.message}`)
                reject(error)
                return
              }

              if (stderr && (!stdout || /error|fail|exception/i.test(stderr))) {
                Logger.warn(`Codacy CLI V2 warnings: ${stderr}`)
              }

              Logger.appendLine(`Codacy CLI V2 output: ${stdout}`)
              vscode.window.showInformationMessage('Codacy analysis completed successfully')
              resolve(stdout)
            }
          )
        })
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        Logger.error(`Failed to run Codacy analysis: ${errorMessage}`)
        vscode.window.showErrorMessage(`Failed to run Codacy analysis: ${errorMessage}`)
        throw error
      }
    }
  )
}
