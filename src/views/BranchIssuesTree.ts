import * as vscode from 'vscode'
import { CodacyCloud } from '../git/CodacyCloud'
import {
  BranchIssuesTreeCategoryNode,
  BranchIssuesTreeGroupByCategoryNode,
  BranchIssuesTreeGroupBySeverityNode,
  BranchIssuesTreeNode,
} from './nodes'
import { BranchIssue, MAX_FETCH_BRANCH_ISSUES } from '../git/IssuesManager'
import { differenceInDays } from 'date-fns'
import { Account } from '../codacy/Account'
import Logger from '../common/logger'

const RECENTLY_ADDED_DAYS = 60

export class BranchIssuesTree extends vscode.Disposable implements vscode.TreeDataProvider<BranchIssuesTreeNode> {
  private _onDidChangeTreeData = new vscode.EventEmitter<BranchIssuesTreeNode | void>()
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event
  private _disposables: vscode.Disposable[] = []
  private _view: vscode.TreeView<BranchIssuesTreeNode> | undefined

  private _allIssues: BranchIssue[] = []

  constructor(
    private _context: vscode.ExtensionContext,
    private _codacyCloud: CodacyCloud
  ) {
    super(() => this.dispose())

    // create the tree view
    try {
      this._view = vscode.window.createTreeView('codacy:branchIssues', {
        treeDataProvider: this,
        showCollapseAll: true,
      })

      this._context.subscriptions.push(this._view)
      Logger.debug('BranchIssuesView created successfully')

      // create a command to open the pull request summary
      this._context.subscriptions.push(
        vscode.commands.registerCommand('codacy.branchIssues.open', () => {
          if (this._view) {
            this._view.reveal(this._view.selection[0])
          }
        })
      )

      // subscribe to changes in the current branch
      this._codacyCloud.branchIssues.onDidUpdateBranchIssues((issues: BranchIssue[]) => {
        this._allIssues = issues
        this._onDidChangeTreeData.fire()

        if (this._view) {
          this._view.title = `${this._codacyCloud.head?.name} - ${issues.length}${
            issues.length >= MAX_FETCH_BRANCH_ISSUES ? '+' : ''
          } issues`
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      Logger.error(`Failed to create BranchIssuesView: ${errorMessage}`)
      Logger.error(
        `[BranchIssuesView] Error stack: ${error instanceof Error ? error.stack : '[BranchIssuesView] No stack trace'}`
      )
      this._view = undefined
      // Don't re-throw - let extension continue even if this view fails
    }
  }

  getTreeItem(element: BranchIssuesTreeNode): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element
  }

  private getRecentlyAddedIssues() {
    const now = new Date()
    return this._allIssues.filter(
      ({ commitIssue: i }) =>
        i.commitInfo?.timestamp && differenceInDays(now, new Date(i.commitInfo?.timestamp)) <= RECENTLY_ADDED_DAYS
    )
  }

  private getMyIssues(userEmails: string[]) {
    return this._allIssues.filter(
      ({ commitIssue: i }) => i.commitInfo?.commiter && userEmails.includes(i.commitInfo?.commiter)
    )
  }

  async getChildren(element?: BranchIssuesTreeNode | undefined) {
    const baseUri = this._codacyCloud.rootUri?.path || ''
    const userEmails = await Account.emails()

    if (!element) {
      const result: BranchIssuesTreeNode[] = [
        new BranchIssuesTreeCategoryNode('All issues', 'bug', this._allIssues, baseUri, true),
      ]

      if (this._allIssues.length > 0) {
        result.push(
          ...[
            new BranchIssuesTreeCategoryNode(
              'Recently added',
              'calendar',
              () => this.getRecentlyAddedIssues(),
              baseUri
            ),
            new BranchIssuesTreeCategoryNode(
              'Introduced by me',
              'account',
              () => this.getMyIssues(userEmails),
              baseUri
            ),
          ]
        )

        result.push(new BranchIssuesTreeGroupByCategoryNode(this._allIssues, baseUri))
        result.push(new BranchIssuesTreeGroupBySeverityNode(this._allIssues, baseUri))
      }

      return result
    } else {
      return await element.getChildren()
    }
  }

  getParent(element: BranchIssuesTreeNode): vscode.ProviderResult<BranchIssuesTreeNode> {
    return element.parent
  }

  dispose() {
    this._disposables.forEach((disposable) => disposable.dispose())
  }
}
