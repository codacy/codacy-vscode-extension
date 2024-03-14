import * as vscode from 'vscode';
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

	const wsFolder = vscode.workspace.getWorkspaceFolder(fileuri) as vscode.WorkspaceFolder

	const relativeFilePath = trimStart(fileuri.fsPath.substring(wsFolder.uri.fsPath.length), '/')

	const coveredLines: vscode.DecorationOptions[] = []
	const nonCoveredLines: vscode.DecorationOptions[] = []

	const coverageHits = pr.coverages.get(relativeFilePath);
	coverageHits?.forEach((value) => {

		const r = editor.document.lineAt(parseInt(value.lineNumber)-1).range;
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
