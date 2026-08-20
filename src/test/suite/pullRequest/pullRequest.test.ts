import * as assert from 'assert'
import * as vscode from 'vscode'
import { SinonSandbox, SinonStub, createSandbox } from 'sinon'
import { PullRequest } from '../../../git/PullRequest'
import { CodacyCloud, CodacyCloudState } from '../../../git/CodacyCloud'
import { PullRequestWithAnalysis } from '../../../api/client'
import { Api } from '../../../api'

const HEAD_COMMIT_SHA = 'a'.repeat(40)
const COMMON_ANCESTOR_COMMIT_SHA = 'b'.repeat(40)

// the sha fields aren't in the vendored API spec yet (see OD-544), so the mock is built untyped
const mockPullRequest = (shas: { headCommitSha?: string; commonAncestorCommitSha?: string }) =>
  ({
    isAnalysing: false,
    meta: { analyzable: true },
    pullRequest: {
      id: 1,
      number: 1,
      updated: new Date().toISOString(),
      status: 'open',
      repository: 'repository',
      title: 'Amazing pull request',
      owner: { name: 'Owner', username: 'owner' },
      gitHref: 'https://github.com/organization/repository/pull/1',
      ...shas,
    },
  }) as unknown as PullRequestWithAnalysis

const mockCodacyCloud = () =>
  ({
    state: CodacyCloudState.Loaded,
    repository: { provider: 'gh', owner: 'organization', name: 'repository' },
    expectCoverage: false,
    rootUri: vscode.Uri.file('/repository'),
    head: undefined,
  }) as unknown as CodacyCloud

suite('Pull Request Test Suite', () => {
  let sinon: SinonSandbox
  let listCommitDeltaIssues: SinonStub
  let refreshed: Promise<unknown> | undefined

  setup(() => {
    sinon = createSandbox()

    // the constructor kicks off refresh() without awaiting it, so grab the task it hands to the progress API
    sinon.stub(vscode.window, 'withProgress').callsFake((_options, task) => {
      refreshed = task(
        { report: () => undefined },
        new vscode.CancellationTokenSource().token
      ) as unknown as Promise<unknown>
      return refreshed as Thenable<unknown>
    })
    sinon.stub(vscode.commands, 'executeCommand').resolves()

    listCommitDeltaIssues = sinon.stub(Api.Analysis, 'listCommitDeltaIssues')
    sinon.stub(Api.Repository, 'getPullRequestQualitySettings').resolves({ data: { qualityGate: {} } })
    sinon.stub(Api.Analysis, 'listPullRequestFiles').resolves({ data: [] })
  })

  teardown(() => {
    sinon.restore()
  })

  test('fetches delta issues when both commit shas are present', async () => {
    listCommitDeltaIssues.resolves({ data: [] })

    const pullRequest = new PullRequest(
      mockPullRequest({
        headCommitSha: HEAD_COMMIT_SHA,
        commonAncestorCommitSha: COMMON_ANCESTOR_COMMIT_SHA,
      }),
      mockCodacyCloud()
    )
    await refreshed

    assert.strictEqual(listCommitDeltaIssues.callCount, 1)
    assert.strictEqual(pullRequest.meta.headCommitSHA, HEAD_COMMIT_SHA)
  })

  test('skips delta issues and still loads the pull request when both commit shas are absent', async () => {
    const pullRequest = new PullRequest(mockPullRequest({}), mockCodacyCloud())
    await refreshed

    assert.ok(listCommitDeltaIssues.notCalled)
    assert.deepStrictEqual(pullRequest.issues, [])
    assert.strictEqual(pullRequest.meta.headCommitSHA, undefined)
    assert.strictEqual(pullRequest.meta.commonAncestorCommitSHA, undefined)
  })

  test('skips delta issues when only the common ancestor sha is absent', async () => {
    const pullRequest = new PullRequest(mockPullRequest({ headCommitSha: HEAD_COMMIT_SHA }), mockCodacyCloud())
    await refreshed

    assert.ok(listCommitDeltaIssues.notCalled)
    assert.deepStrictEqual(pullRequest.issues, [])
  })
})
