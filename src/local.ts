import * as vscode from 'vscode';
import { LocalToolsTree } from './views/LocalToolsTree';
import * as fs from 'node:fs'
import * as cp from 'child_process'
import { RepositoryManager } from './git/RepositoryManager';
import { handleError } from './common/utils'
import * as crypto from 'crypto'
const commandExistsSync = require('command-exists').sync


export interface IlocalTool
{
	title: string,
	cliCommand: string,
	cliExecute: string,
	cliVersion: string,
	cliInstallMacos: string,
	cliInstallApt: string
}

export class LocalTool implements IlocalTool
{
	title = ''
	cliCommand = ''
	cliExecute = ''
	cliVersion = ''
	cliInstallMacos = ''
	cliInstallApt = ''
	public installStatus: boolean
	public cloudEnabled: boolean

	public updateInstallStatus () {
			this.installStatus = commandExistsSync(this.cliCommand)
	}

	// I fucking hate this by the way.
	constructor (toolInfo : IlocalTool) {

		this.title = toolInfo.title
		this.cliCommand = toolInfo.cliCommand
		this.cliExecute = toolInfo.cliExecute
		this.cliVersion = toolInfo.cliVersion
		this.cliInstallMacos = toolInfo.cliInstallMacos
		this.cliInstallApt = toolInfo.cliInstallApt
		this.installStatus = false
		this.cloudEnabled = false

		this.updateInstallStatus()
	}
}

export function parseIssueLevel(level: string | undefined) {

	let vscodeLevel = vscode.DiagnosticSeverity.Error;
	if (!level) { return vscodeLevel }
	switch (level.toLowerCase()) {
		case "hint":
			vscodeLevel = vscode.DiagnosticSeverity.Hint;
		case "note":
		case "info":
			vscodeLevel = vscode.DiagnosticSeverity.Information;
			break;
		case "warning":
			vscodeLevel = vscode.DiagnosticSeverity.Warning;
			break;
	}

	return vscodeLevel;
}

function progressBar(inc: number, title?: string | undefined) {
	if (title === undefined)
		{
			title = 'codacy scanning'
		}
	vscode.window.withProgress({
		location: vscode.ProgressLocation.Window,
		cancellable: true,
		title: title
	}, async (progress) => {
		progress.report({  increment: inc });
	});
}

let codacyKeypressTimeout: NodeJS.Timeout | null = null;

export function handleLocalModeKeypress( 
	diagnosticCollection : vscode.DiagnosticCollection, 
	toolsList : Array<LocalTool>,
	repoManager : RepositoryManager) {
	// Clear existing timeout
	if (codacyKeypressTimeout) {
			clearTimeout(codacyKeypressTimeout);
	}

	// Set new timeout
	codacyKeypressTimeout = setTimeout(() => {
			runLocal(diagnosticCollection, toolsList, repoManager, vscode.window.activeTextEditor?.document, "hesitate")
	}, 2000);
}


export async function inspectLocal(diagnosticCollection : vscode.DiagnosticCollection, currentFile: vscode.Uri) {

	if (vscode.workspace.workspaceFolders !== undefined && vscode.workspace.workspaceFolders.length > 0) {

		const diagnosticMap: Map<vscode.Uri, vscode.Diagnostic[]> = new Map();
		// FIXME: only clear this for the file that's currently being worked on
		diagnosticCollection.clear()
		diagnosticCollection.set(currentFile, [])
			

		for (let i = 0; i < vscode.workspace.workspaceFolders.length; i++) {

			const cwd = vscode.workspace.workspaceFolders[i].uri.path
			const sarifFolder = cwd + '/.codacy/runs/';
			//const fs = require('fs');
			
			const files = fs.readdirSync(sarifFolder);
			
			for (let j=0; j <files.length; j++) {
				const file = files[j] as string;
				const resultFileContents = fs.readFileSync(sarifFolder + file, { encoding: 'utf8' });
				try {

					const jsonContents = JSON.parse(resultFileContents);

					const fileEnding = file.split(".").pop();
					if (fileEnding === "sarif") {
						for (let k=0; k<jsonContents.runs.length; k++) {

							const toolName = jsonContents.runs[k].tool.driver.name;
							let diagnostics = diagnosticMap.get(currentFile);
							if (!diagnostics) { diagnostics = []; }
							for (let m=0; m<jsonContents.runs[k].results.length; m++) {
								const issue = jsonContents.runs[k].results[m];

								// some sarif files give a relative path and some give an absolute path -- this normalizes to absolute.
								//const canonicalFile = cwd + "/" + issue.locations[0].physicalLocation.artifactLocation.uri.replace(cwd, '').replace(/^\/+/, '');

								const line = issue.locations[0].physicalLocation.region.startLine - 1
								const column = issue.locations[0].physicalLocation.region.startColumn ?? 0
								const endLine = issue.locations[0].physicalLocation.region.endLine - 1
								const endColumn = issue.locations[0].physicalLocation.region.endColumn ?? 1


								const range = new vscode.Range(line, column, endLine, endColumn)
								const diagnostic = new vscode.Diagnostic(range, issue.message.text, parseIssueLevel(issue.level))
								diagnostic.code = issue.ruleId

								// fixme -- horrible hack to make Checkov local results look the same as cloud ones.
								if (toolName === "Checkov") {
									diagnostic.severity = vscode.DiagnosticSeverity.Warning
									diagnostic.range = new vscode.Range(line, column, line+1, endColumn)
								}	

								diagnostics.push(diagnostic)
							}
							diagnosticMap.set(currentFile, diagnostics)
						}
					}
				} catch (error) {
					console.log(error);
					progressBar(100)
				}
			}

			diagnosticMap.forEach((diags, file) => {
				diagnosticCollection.set(file, diags);
				});

			progressBar(100)
		}
	} else {

		progressBar(100)
		vscode.window.showErrorMessage('There are no workspaces to analyze!');
		return;
	}
}

export function runLocal(diagnosticCollection : vscode.DiagnosticCollection, toolsList : Array<LocalTool>, repoManager : RepositoryManager, currentFile: vscode.TextDocument | undefined, mode: string) {

	if (!currentFile) {
		return
	}

	progressBar(10)



	if (vscode.workspace.workspaceFolders !== undefined && vscode.workspace.workspaceFolders.length > 0) {

		for (let i = 0; i < vscode.workspace.workspaceFolders.length; i++) {
			const workspaceFolder = vscode.workspace.workspaceFolders[i].uri.path;
			const hesitateTempDir = workspaceFolder + '/.codacy/temp';

			let scanFilePath = currentFile.uri.fsPath
			// to scan a file on hesitate we need to copy the current file into a temp file and scan that
			if (mode === "hesitate") {

				if (fs.existsSync(hesitateTempDir)) {
					fs.rmSync(hesitateTempDir, {"force":true, "recursive": true} )
				}
				fs.mkdirSync(hesitateTempDir, { recursive: true });
				fs.chmodSync(hesitateTempDir, '766');

				const docText = currentFile.getText()

				const randomBytes = crypto.randomBytes(10).toString('hex')
				var fileExtension = currentFile.fileName.split('.').pop()
				fileExtension = (fileExtension != currentFile.fileName) ? '.' + fileExtension : ''

				const tempFileName = hesitateTempDir + '/codacyTemp' + randomBytes + fileExtension
				fs.writeFileSync(tempFileName, docText)
				scanFilePath = tempFileName
			} 

			// reset the runs directory
			// fixme: only delete outputs of tools we're about to run, instead.
			const dir = workspaceFolder + '/.codacy/runs';

			if (fs.existsSync(dir)) {
				fs.rmSync(dir, {"force":true, "recursive": true} )
			}

			fs.mkdirSync(dir, { recursive: true });
			fs.chmodSync(dir, '766');
			
			for (let j=0; j<toolsList.length; j++)
				{
					// fixme: don't use title, record the codacyToolName in the json
					if (!repoManager.repoTools.has(toolsList[j].title)) {
						continue
					}

					if (!toolsList[j].installStatus) {
						continue
					}


					let execCommand = toolsList[j].cliExecute.replace("[[PATH]]", scanFilePath);

					const toolParms = repoManager.parametersForTool(toolsList[j].title) ?? ''
					execCommand = execCommand.replace("[[PARMS]]", toolParms);

					// doing this synchronously because I'm too stupid to work out how to run all the tools in their own thread and wait
					// for the last one to finish before inspecting results.
					// fixme: figure out how to do error handling here (sync doesn't take a callback)
					cp.execSync(
						execCommand,
						{cwd: workspaceFolder }
						);

				}

				// leave no trace on disk!
				if (mode === "hesitate") {
					if (fs.existsSync(hesitateTempDir)) {
						fs.rmSync(hesitateTempDir, {"force":true, "recursive": true} )
					}
				}
				
				progressBar(50)
				inspectLocal(diagnosticCollection, currentFile.uri)
		}


	} else {
		vscode.window.showErrorMessage('There are no workspaces to analyze!')
		return
	}
}
function installRef (tool : IlocalTool) {
	let ref = '';
	switch (process.platform) {
		case 'darwin':
			ref = tool.cliInstallMacos;
			break;
		case 'linux':
			ref = tool.cliInstallApt;
			break;
		default:
			break;
	}
	return ref;
}

export function installLocal(toolsList : Array<LocalTool>, toolsTree : LocalToolsTree) {
	// fixme -- if all local tools are installed, say that and exit.
	let options: vscode.MessageOptions


	let installScript = '';
	for (let i=0; i<toolsList.length; i++) {
    if (!commandExistsSync(toolsList[i].cliCommand)) {
      installScript += installRef(toolsList[i]) + ';\n';
    }
	}

	if (installScript === '') {
		const options: vscode.MessageOptions = { detail: 'All local tools Codacy knows about are already installed.', modal: true };
		vscode.window.showInformationMessage("Codacy - Install Local Tools", options, ...["OK"])
		return
	}

	switch (process.platform.toLowerCase()) {
		case 'linux':
			options = { detail: 'To accomplish local scanning, Codacy needs some open-source tools installed globally on your local machine. Codacy will open a terminal with the install commands (snap and python first, then the individual tools). You will need to supply your password to sudo, then manually refresh Codacy.', modal: true };
			vscode.window.showInformationMessage("Codacy - Install Local Tools", options, ...["Proceed"]).then((selection)=>{
				if (selection !== 'Proceed')
					return
				

				if (!commandExistsSync('snap')) {
					installScript = 'sudo apt install snapd; ' + installScript
				}

				if (!commandExistsSync('pip3')) {
					installScript = 'sudo apt-get update && sudo apt-get install -y python3 && sudo apt-get install -y python3-pip; ' + installScript
				}

				const terminal = vscode.window.createTerminal('Codacy Installer Terminal')
				terminal.show()
		
				console.log("linux installscript: " + installScript)
				// Send the sudo command to the terminal
				terminal.sendText(installScript.trim())
			})
			break
		case 'darwin':
			options = { detail: 'To accomplish local scanning, Codacy needs some open-source tools installed globally on your local machine. Codacy can do this automatically for MacOS using the Brew package manager.', modal: true };
			vscode.window.showInformationMessage("Codacy - Install Local Tools", options, ...["Proceed"])

			options = { detail: 'Codacy will execute the following commands:\n\n' + installScript, modal: true };
			vscode.window.showInformationMessage("Codacy - Install Local Tools", options, ...["Install"]).then(()=>{
		
				progressBar(0, 'codacy installing')
				try {

					cp.execSync(installScript)
				} catch (e) {
					handleError(e as Error)
				}
				toolsList.forEach((tool) => {tool.updateInstallStatus()})
				toolsTree.refresh()
				progressBar(100, 'codacy installing')
				vscode.window.showInformationMessage("Codacy finished installing local tools.")
			})

			break
		default:
			options = { detail: 'Windows is currently unsupported. Sorry! Coming soon, leveraging WSL.', modal: true };
			vscode.window.showInformationMessage("Codacy - Install Local Tools", options, ...["Proceed"])
			return
	}






	
	
}