import { SinonSandbox, createSandbox } from 'sinon'
import { MockExtensionContext } from '../../mocks/MockExtensionContext'
import { RepositoryManager } from '../../../git/RepositoryManager'
import { MockRepository } from '../../mocks/MockRepository'
import { Repository as GitRepository } from '../../../git/git'

suite('Repository Manager Test Suite', () => {
  let context: MockExtensionContext
  let sinon: SinonSandbox
  let rm: RepositoryManager
  let repo: GitRepository

  setup(() => {
    sinon = createSandbox()
    context = new MockExtensionContext()
    rm = new RepositoryManager()
    repo = new MockRepository()
  })

  teardown(() => {
    context.dispose()
    sinon.restore()
    rm.dispose()
  })

  test('Open Repository', async () => {
    await rm.open(repo)

    // TODO: write some tests
  })
})
