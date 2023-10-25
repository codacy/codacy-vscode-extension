import * as vscode from 'vscode'
import { PullRequestInfo } from '../../git/PullRequest'
import { PullRequestSummaryNode } from './'
import axios from 'axios'

export const getUserAvatar = async (url: string, width: number = 16, height: number = 16) => {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    })

    const buffer = Buffer.from(response.data, 'binary')

    const innerImageEncoded = `data:image/jpeg;size:${buffer.byteLength};base64,${buffer.toString('base64')}`
    const contentsString = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image href="${innerImageEncoded}" width="${width}" height="${height}" style="clip-path: inset(0 0 0 0 round 50%);"/>
  </svg>`

    const contents = Buffer.from(contentsString)
    const finalDataUri = vscode.Uri.parse(
      `data:image/svg+xml;size:${contents.byteLength};base64,${contents.toString('base64')}`
    )

    return finalDataUri
  } catch (e) {
    return undefined
  }
}

export class PullRequestAuthorNode extends vscode.TreeItem {
  constructor(_pr: PullRequestInfo, _avatarUri?: vscode.Uri) {
    const labelPosfix = _pr.analysis.pullRequest.owner.username ? ` (${_pr.analysis.pullRequest.owner.username})` : ''
    super(`By ${_pr.analysis.pullRequest.owner.name}${labelPosfix}`, vscode.TreeItemCollapsibleState.None)
    this.iconPath = _avatarUri ?? new vscode.ThemeIcon('github')
  }

  public static async create(_pr: PullRequestInfo): Promise<PullRequestAuthorNode> {
    const avatarUri = _pr.analysis.pullRequest.owner.avatarUrl
      ? await getUserAvatar(_pr.analysis.pullRequest.owner.avatarUrl)
      : undefined
    return new PullRequestAuthorNode(_pr, avatarUri)
  }

  get parent(): PullRequestSummaryNode | undefined {
    return undefined
  }

  async getChildren(): Promise<PullRequestSummaryNode[]> {
    return []
  }
}
