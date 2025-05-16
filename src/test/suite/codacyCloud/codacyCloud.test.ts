import { SinonSandbox, createSandbox } from 'sinon'
import { MockExtensionContext } from '../../mocks/MockExtensionContext'
import { CodacyCloud } from '../../../git/CodacyCloud'
import { MockRepository } from '../../mocks/MockRepository'
import { Repository as GitRepository } from '../../../git/git'

suite('Codacy Cloud Test Suite', () => {
  let context: MockExtensionContext
  let sinon: SinonSandbox
  let rm: CodacyCloud
  let repo: GitRepository

  setup(() => {
    sinon = createSandbox()
    context = new MockExtensionContext()
    rm = new CodacyCloud()
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
