/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from 'assert'
import { SinonSandbox, createSandbox } from 'sinon'
import { BranchState, CodacyCloud } from '../../../git/CodacyCloud'
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

  test('default branch uses the repository last analysed commit without another request', async () => {
    checkout('master', DEFAULT_SHA, [branch('master', true)])
    const getRepo = sinon.stub(AnalysisService, 'getRepositoryWithAnalysis')

    await cloud.loadIssues()

    assert.ok(getRepo.notCalled)
    assert.strictEqual((cloud as any)._branchState, BranchState.OnAnalysedBranch)
  })

  test('discards the result when the branch changes during the request', async () => {
    checkout('replicate-master', FEATURE_SHA, [branch('master', true), branch('replicate-master', false)])
    sinon.stub(AnalysisService, 'getRepositoryWithAnalysis').callsFake((() => {
      ;(cloud as any)._branch = 'master'
      return Promise.resolve({ data: { lastAnalysedCommit: { sha: FEATURE_SHA } } })
    }) as any)

    await cloud.loadIssues()

    assert.strictEqual((cloud as any)._branchState, BranchState.OnUnknownBranch)
  })

  test('keeps the state when the last analysed commit request fails', async () => {
    checkout('replicate-master', FEATURE_SHA, [branch('master', true), branch('replicate-master', false)])
    sinon.stub(AnalysisService, 'getRepositoryWithAnalysis').rejects(new Error('network down'))

    await cloud.loadIssues()

    assert.strictEqual((cloud as any)._branchState, BranchState.OnUnknownBranch)
  })

  test('refreshEnabledBranches ignores a response superseded by a later refresh', async () => {
    checkout('master', DEFAULT_SHA, [branch('master', true)])
    let resolveFirst: (value: any) => void = () => undefined
    const list = sinon.stub(RepositoryService, 'listRepositoryBranches')
    list.onFirstCall().returns(new Promise((resolve) => (resolveFirst = resolve)) as any)
    list.onSecondCall().resolves({ data: [branch('master', true), branch('replicate-master', false)] } as any)

    const first = cloud.refreshEnabledBranches()
    await cloud.refreshEnabledBranches()
    resolveFirst({ data: [branch('master', true)] })
    await first

    assert.deepStrictEqual(
      cloud.enabledBranches.map((b) => b.name),
      ['master', 'replicate-master']
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
