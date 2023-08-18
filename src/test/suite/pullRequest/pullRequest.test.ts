import { SinonSandbox, createSandbox } from 'sinon'
import { MockExtensionContext } from '../../mocks/MockExtensionContext'

suite('Pull Request Test Suite', () => {
  let context: MockExtensionContext
  let sinon: SinonSandbox

  setup(() => {
    sinon = createSandbox()
    context = new MockExtensionContext()
  })

  teardown(() => {
    context.dispose()
    sinon.restore()
  })

  test('Loads Pull Request', () => {})
})
