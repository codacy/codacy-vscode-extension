import axios from 'axios';
import * as vscode from 'vscode';
import { fileURLToPath } from 'url';
import { PullRequest } from '../git/PullRequest'
import { trimStart } from 'lodash';


const coverageDecorationType = vscode.window.createTextEditorDecorationType({

	overviewRulerColor: 'green',
	overviewRulerLane: vscode.OverviewRulerLane.Left,
	
	light: {
		// this color will be used in light color themes
		backgroundColor: 'lightgreen'
	},
	dark: {
		// this color will be used in dark color themes
		backgroundColor: 'darkgreen'
	}
});


const noCoverageDecorationType = vscode.window.createTextEditorDecorationType({

	overviewRulerColor: 'red',
	overviewRulerLane: vscode.OverviewRulerLane.Left,
	
	light: {
		// this color will be used in light color themes
		backgroundColor: '#ffcccc'
	},
	dark: {
		// this color will be used in dark color themes
		backgroundColor: '#440000'
	}
});

export async function decorateWithCoverage(editor: vscode.TextEditor, fileuri : vscode.Uri, pr : PullRequest | undefined) {

	if (!pr) {
		return
	}

	let wsFolder = vscode.workspace.getWorkspaceFolder(fileuri) as vscode.WorkspaceFolder

	let relativeFilePath = trimStart(fileuri.fsPath.substring(wsFolder.uri.fsPath.length), '/')
	relativeFilePath = relativeFilePath

	const coveredLines: vscode.DecorationOptions[] = []
	const nonCoveredLines: vscode.DecorationOptions[] = []

	let coverageHits = pr.coverages.get(relativeFilePath);
	coverageHits?.forEach((value,key) => {

		let r = editor.document.lineAt(parseInt(value.lineNumber)-1).range;
		if (value.hits > 0){
			const decoration = { range: r, hoverMessage: 'test coverage' };
			coveredLines.push(decoration);
		} else {
			const decoration = { range: r, hoverMessage: 'no test coverage' };
			nonCoveredLines.push(decoration);
			
		}
	});

	editor.setDecorations(coverageDecorationType, coveredLines);
	editor.setDecorations(noCoverageDecorationType, nonCoveredLines);
	
}
