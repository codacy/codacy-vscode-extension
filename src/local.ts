import * as vscode from 'vscode';
import { LocalToolsTree } from './views/LocalToolsTree';
import fs from "fs"
import commandExists from "command-exists"
import cp from 'child_process'

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

	public updateInstallStatus () {
			this.installStatus = commandExists.sync(this.cliCommand)
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

		this.updateInstallStatus()
	}
}

export function parseIssueLevel(level: string | undefined) {
	console.log(level);

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
	if (title == undefined)
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
	toolsList : Array<IlocalTool>) {
	// Clear existing timeout
	if (codacyKeypressTimeout) {
			clearTimeout(codacyKeypressTimeout);
	}

	// Set new timeout
	codacyKeypressTimeout = setTimeout(() => {
			runLocal(diagnosticCollection, toolsList, vscode.window.activeTextEditor?.document.uri.fsPath)
	}, 3000);
}


export async function inspectLocal(diagnosticCollection : vscode.DiagnosticCollection) {

	if (vscode.workspace.workspaceFolders !== undefined && vscode.workspace.workspaceFolders.length > 0) {

		const diagnosticMap: Map<string, vscode.Diagnostic[]> = new Map();
		// FIXME: only clear this for the file that's currently being worked on
		//diagnosticCollection.clear();

		for (let i = 0; i < vscode.workspace.workspaceFolders.length; i++) {

			const cwd = vscode.workspace.workspaceFolders[i].uri.path
			const sarifFolder = cwd + '/.codacy/runs/';
			//const fs = require('fs');
			
			const files = fs.readdirSync(sarifFolder);
			
			for (let j=0; j <files.length; j++) {
				const file = files[j] as string;
				const resultFileContents = fs.readFileSync(sarifFolder + file, { encoding: 'utf8' });
				try {
					diagnosticCollection.set(vscode.Uri.parse(file), []);

					const jsonContents = JSON.parse(resultFileContents);

					const fileEnding = file.split(".").pop();
					if (fileEnding === "sarif") {
						for (i=0; i<jsonContents.runs.length; i++) {
							for (j=0; j<jsonContents.runs[i].results.length; j++) {
								const issue = jsonContents.runs[i].results[j];

								const canonicalFile = cwd + "/" + issue.locations[0].physicalLocation.artifactLocation.uri.replace(cwd, '');
								//let canonicalFile = issue.locations[0].physicalLocation.artifactLocation.uri;
								let diagnostics = diagnosticMap.get(canonicalFile);
								if (!diagnostics) { diagnostics = []; }
								const line = issue.locations[0].physicalLocation.region.startLine - 1;
								const column = issue.locations[0].physicalLocation.region.startColumn;
								const endLine = issue.locations[0].physicalLocation.region.endLine - 1;
								const endColumn = issue.locations[0].physicalLocation.region.endColumn;
								const range = new vscode.Range(line, column, endLine, endColumn);
								const diagnostic = new vscode.Diagnostic(range, issue.message.text, parseIssueLevel(issue.level));
								diagnostic.code = issue.ruleId;
								diagnostics.push(diagnostic);
								diagnosticMap.set(canonicalFile, diagnostics);
							}
						}
					}
				} catch (error) {
					console.log(error);
					progressBar(100)
				}
			};

			diagnosticMap.forEach((diags, file) => {
				diagnosticCollection.set(vscode.Uri.parse(file), diags);
				});

			progressBar(100)
		}
	} else {

		progressBar(100)
		vscode.window.showErrorMessage('There are no workspaces to analyze!');
		return;
	}
}

export function runLocal(diagnosticCollection : vscode.DiagnosticCollection, toolsList : Array<IlocalTool>, currentFile: string | undefined) {


	if (!currentFile) {
		return
	}

	progressBar(10)

		if (vscode.workspace.workspaceFolders !== undefined && vscode.workspace.workspaceFolders.length > 0) {

			for (let i = 0; i < vscode.workspace.workspaceFolders.length; i++) {
				const workspaceFolder = vscode.workspace.workspaceFolders[i].uri.path;


				// reset the runs directory
				//const fs = require('fs');
				const dir = workspaceFolder + '/.codacy/runs';

				if (fs.existsSync(dir)) {
					fs.rmSync(dir, {"force":true, "recursive": true} )
				}

				fs.mkdirSync(dir, { recursive: true });
				fs.chmodSync(dir, '766');
				
				for (let j=0; j<toolsList.length; j++)
					{
						// fixme: filter tools based on workspace config from codacy...?

						// we can easily overflow stdout so let's pipe to a temp file.
						const execCommand = toolsList[j].cliExecute.replace("[[PATH]]", currentFile);
						// doing this synchronously because I'm too stupid to work out how to run all the tools in their own thread and wait
						// for the last one to finish before inspecting results.
						// fixme: figure out how to do error handling here (sync doesn't take a callback)
						cp.execSync(
							execCommand,
							{cwd: workspaceFolder }
							);
					}

					progressBar(50)
					inspectLocal(diagnosticCollection)
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
    if (!commandExists.sync(toolsList[i].cliCommand)) {
      installScript += installRef(toolsList[i]) + ';\n';
    }
	}

	if (installScript === '') {
		const options: vscode.MessageOptions = { detail: 'All local tools Codacy knows about are already installed.', modal: true };
		vscode.window.showInformationMessage("Codacy - Install Local Tools", options, ...["OK"])
		return
	}



	options = { detail: 'To accomplish local scanning, Codacy needs some open-source tools installed globally on your local machine. Codacy can do this automatically for Linux (using apt) and MacOS (using Brew).', modal: true };
	vscode.window.showInformationMessage("Codacy - Install Local Tools", options, ...["Proceed"]).then((item)=>{
			console.log(item);
	});




	options = { detail: 'Codacy will execute the following commands. If you need to sudo, please copy this script and execute manually:\n\n' + installScript, modal: true };
	vscode.window.showInformationMessage("Codacy - Install Local Tools", options, ...["Install"]).then(()=>{

		progressBar(0, 'codacy installing')
		cp.execSync(installScript)
		toolsList.forEach((tool) => {tool.updateInstallStatus()})
		toolsTree.refresh()
		progressBar(100, 'codacy installing')
	})
	
	
}