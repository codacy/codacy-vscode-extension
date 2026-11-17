/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from 'assert'
import { SinonSandbox, createSandbox } from 'sinon'
import { BranchState, CodacyCloud, CodacyCloudState } from '../../../git/CodacyCloud'
import { AnalysisService, Branch, RepositoryService } from '../../../api/client'

const DEFAULT_SHA = '72173f2000000000000000000000000000000000'
const FEATURE_SHA = 'a3b0d19000000000000000000000000000000000'

const branch = (name: string, isDefault: boolean): Branch => ({
  id: isDefault ? 1 : 2,
  name,
  isDefault,
  isEnabled: true,
  branchType: 'Branch',
})

suite('Branch overview on enabled branches', () => {
  let sinon: SinonSandbox
  let cloud: CodacyCloud

  // puts the CodacyCloud instance on `branchName`, with HEAD at `headSha`
  const checkout = (branchName: string, headSha: string, enabledBranches: Branch[]) => {
    const c = cloud as any
    c._repository = {
      repository: { name: 'repo', owner: 'org', provider: 'gh' },
      lastAnalysedCommit: { sha: DEFAULT_SHA },
    }
    c._current = { state: { HEAD: { name: branchName, commit: headSha } } }
    c._branch = branchName
    c._enabledBranches = enabledBranches
  }

  setup(() => {
    sinon = createSandbox()
    cloud = new CodacyCloud()
    sinon.stub(cloud.branchIssues, 'refresh').resolves()
  })

  teardown(() => {
    sinon.restore()
    cloud.dispose()
  })

  test('non-default branch uses its own last analysed commit', async () => {
    checkout('replicate-master', FEATURE_SHA, [branch('master', true), branch('replicate-master', false)])
    const getRepo = sinon
      .stub(AnalysisService, 'getRepositoryWithAnalysis')
      .resolves({ data: { lastAnalysedCommit: { sha: FEATURE_SHA } } } as any)

    await cloud.loadIssues()

    assert.ok(getRepo.calledOnceWith('gh', 'org', 'repo', 'replicate-master'))
    assert.strictEqual((cloud as any)._branchState, BranchState.OnAnalysedBranch)
  })

  test('non-default branch behind its own analysis is outdated', async () => {
    checkout('replicate-master', DEFAULT_SHA, [branch('master', true), branch('replicate-master', false)])
    sinon
      .stub(AnalysisService, 'getRepositoryWithAnalysis')
      .resolves({ data: { lastAnalysedCommit: { sha: FEATURE_SHA } } } as any)

    await cloud.loadIssues()

    assert.strictEqual((cloud as any)._branchState, BranchState.OnAnalysedBranchOutdated)
  })

  test('default branch fetches a fresh last analysed commit instead of the cached one', async () => {
    const NEW_DEFAULT_SHA = 'b0b0b0b000000000000000000000000000000000'
    // cached repository analysis still points at DEFAULT_SHA; HEAD is at the newly analysed commit
    checkout('master', NEW_DEFAULT_SHA, [branch('master', true)])
    const getRepo = sinon
      .stub(AnalysisService, 'getRepositoryWithAnalysis')
      .resolves({ data: { lastAnalysedCommit: { sha: NEW_DEFAULT_SHA } } } as any)

    await cloud.loadIssues()

    assert.ok(getRepo.calledOnceWith('gh', 'org', 'repo', 'master'))
    assert.strictEqual((cloud as any)._branchState, BranchState.OnAnalysedBranch)
  })

  test('discards the result when the branch is disabled during the request', async () => {
    checkout('replicate-master', FEATURE_SHA, [branch('master', true), branch('replicate-master', false)])
    sinon.stub(AnalysisService, 'getRepositoryWithAnalysis').callsFake((() => {
      // the branch is disabled on Codacy and the view reset while the request is in flight
      ;(cloud as any)._enabledBranches = [branch('master', true)]
      return Promise.resolve({ data: { lastAnalysedCommit: { sha: FEATURE_SHA } } })
    }) as any)

    await cloud.loadIssues()

    assert.strictEqual((cloud as any)._branchState, BranchState.OnUnknownBranch)
    assert.ok((cloud.branchIssues.refresh as any).notCalled)
  })

  test('refreshEnabledBranches drops the response when the repository changes during the request', async () => {
    checkout('master', DEFAULT_SHA, [branch('master', true)])
    sinon.stub(RepositoryService, 'listRepositoryBranches').callsFake((() => {
      // the user opens another repository while the request is in flight
      ;(cloud as any)._repository = { repository: { name: 'other', owner: 'org', provider: 'gh' } }
      ;(cloud as any)._enabledBranches = [branch('main', true)]
      return Promise.resolve({ data: [branch('master', true), branch('replicate-master', false)] })
    }) as any)

    await cloud.refreshEnabledBranches()

    assert.deepStrictEqual(
      cloud.enabledBranches.map((b) => b.name),
      ['main']
    )
  })

  test('refreshEnabledBranches picks up a branch enabled after load', async () => {
    checkout('master', DEFAULT_SHA, [branch('master', true)])
    sinon
      .stub(RepositoryService, 'listRepositoryBranches')
      .resolves({ data: [branch('master', true), branch('replicate-master', false)] } as any)

    await cloud.refreshEnabledBranches()

    assert.deepStrictEqual(
      cloud.enabledBranches.map((b) => b.name),
      ['master', 'replicate-master']
    )
  })

  test('discards the result when the branch changes during the request', async () => {
    checkout('replicate-master', FEATURE_SHA, [branch('master', true), branch('replicate-master', false)])
    sinon.stub(AnalysisService, 'getRepositoryWithAnalysis').callsFake((() => {
      // the user switches branch while the request is in flight
      ;(cloud as any)._branch = 'master'
      return Promise.resolve({ data: { lastAnalysedCommit: { sha: FEATURE_SHA } } })
    }) as any)

    await cloud.loadIssues()

    assert.strictEqual((cloud as any)._branchState, BranchState.OnUnknownBranch)
    assert.ok((cloud.branchIssues.refresh as any).notCalled)
  })

  test('keeps the state and retries when the commit lookup fails', async () => {
    const clock = sinon.useFakeTimers()
    checkout('replicate-master', FEATURE_SHA, [branch('master', true), branch('replicate-master', false)])
    const getRepo = sinon.stub(AnalysisService, 'getRepositoryWithAnalysis')
    getRepo.onFirstCall().rejects(new Error('network down'))
    getRepo.onSecondCall().resolves({ data: { lastAnalysedCommit: { sha: FEATURE_SHA } } } as any)

    await cloud.loadIssues()
    assert.strictEqual((cloud as any)._branchState, BranchState.OnUnknownBranch)

    await clock.tickAsync(2 * 60 * 1000)

    assert.ok(getRepo.calledTwice)
    assert.strictEqual((cloud as any)._branchState, BranchState.OnAnalysedBranch)
  })

  test('refreshCurrentBranch shows the overview when the current branch gets enabled', async () => {
    checkout('replicate-master', FEATURE_SHA, [branch('master', true)])
    ;(cloud as any)._state = CodacyCloudState.Loaded
    sinon
      .stub(RepositoryService, 'listRepositoryBranches')
      .resolves({ data: [branch('master', true), branch('replicate-master', false)] } as any)
    sinon
      .stub(AnalysisService, 'getRepositoryWithAnalysis')
      .resolves({ data: { lastAnalysedCommit: { sha: FEATURE_SHA } } } as any)
    const loadPr = sinon.stub(cloud, 'loadPullRequest').resolves()

    await cloud.refreshCurrentBranch()

    assert.ok(loadPr.notCalled)
    assert.strictEqual((cloud as any)._branchState, BranchState.OnAnalysedBranch)
  })

  test('refreshCurrentBranch falls back to the pull request when the current branch gets disabled', async () => {
    checkout('replicate-master', FEATURE_SHA, [branch('master', true), branch('replicate-master', false)])
    ;(cloud as any)._state = CodacyCloudState.Loaded
    ;(cloud as any)._branchState = BranchState.OnAnalysedBranch
    sinon.stub(RepositoryService, 'listRepositoryBranches').resolves({ data: [branch('master', true)] } as any)
    const loadPr = sinon.stub(cloud, 'loadPullRequest').resolves()

    await cloud.refreshCurrentBranch()

    assert.ok(loadPr.calledOnce)
    assert.ok((cloud.branchIssues.refresh as any).notCalled)
    assert.strictEqual((cloud as any)._branchState, BranchState.OnUnknownBranch)
  })

  test('refreshEnabledBranches throws when asked to, for the initial load', async () => {
    checkout('master', DEFAULT_SHA, [])
    sinon.stub(RepositoryService, 'listRepositoryBranches').rejects(new Error('boom'))

    await assert.rejects(cloud.refreshEnabledBranches({ throwOnError: true }), /boom/)
  })

  test('refreshEnabledBranches keeps the previous list when the request fails', async () => {
    checkout('master', DEFAULT_SHA, [branch('master', true)])
    sinon.stub(RepositoryService, 'listRepositoryBranches').rejects(new Error('boom'))

    await cloud.refreshEnabledBranches()

    assert.deepStrictEqual(
      cloud.enabledBranches.map((b) => b.name),
      ['master']
    )
  })
})
