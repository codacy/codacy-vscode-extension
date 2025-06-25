import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import Logger from '../common/logger'

type Workflow = {
  name: string
  description: string
  content: string
}

const workflows: Workflow[] = [
  {
    name: 'codacy-fix-issues',
    description: 'Find and fix issues in your project using Codacy local analysis',
    content: `
If the user gave you files as context: 

1. Run the 'codacy_cli_analyze' tool for each of the files given as context, with the following params:
 - rootPath: set to the workspace path
 - file: set to the path of the file
 - tool: leave empty or unset
2. If any issues are found in the files, propose and apply fixes for them.
3. If you encounter that Codacy is applying a tool to the project that it shouldn't, don't try to find the configuration of Codacy, just let the user know it's a false positive issue.

If the user didn't provide any files as context:

1. Ask the user which files they want to analyse.
2. Analyse the files they answer with by running 'codacy_cli_analyze' tool for each file, with the following params:
 - rootPath: set to the workspace path
 - file: set to the path of the file
 - tool: leave empty or unset
3. If any issues are found in the files, propose and apply fixes for them.
4. If you encounter that Codacy is applying a tool to the project that it shouldn't, don't try to find the configuration of Codacy, just let the user know it's a false positive issue.`,
  },
  {
    name: 'codacy-check-coverage',
    description: 'Check code coverage of your project using Codacy',
    content: `
1. Call 'codacy_get_file_coverage' tool for each of the files given as context
2. If any files are missing coverage, propose and apply fixes for them
    `,
  },
]

export const createWindsurfWorkflows = () => {
  const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
  if (!workspacePath) {
    throw new Error('No workspace folder found')
  }
  const fileFolder = path.join(workspacePath, '.windsurf', 'workflows')
  if (!fs.existsSync(fileFolder)) {
    fs.mkdirSync(fileFolder, { recursive: true })
  }
  workflows.forEach((workflow) => {
    const filePath = path.join(fileFolder, `${workflow.name}.md`)
    fs.writeFileSync(
      filePath,
      `---
description: ${workflow.description}
---
${workflow.content}`
    )
  })
  Logger.appendLine(`Generated workflow files`)
}
