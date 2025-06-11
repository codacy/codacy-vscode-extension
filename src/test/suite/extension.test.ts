import * as vscode from 'vscode'
import { MockExtensionContext } from '../mocks/MockExtensionContext'
import * as sinon from 'sinon'
import { CodacyCloud } from '../../git/CodacyCloud'
import { CommandType, wrapExtensionCommand } from '../../common/utils'
import { activate, deactivate } from '../../extension'
import Logger from '../../common/logger'

const testRegisterCommands = async (context: vscode.ExtensionContext, codacyCloud: CodacyCloud) => {
  const commands: Record<string, CommandType> = {
    'codacy.refresh': () => codacyCloud.refresh(),
  }
  Object.keys(commands).forEach((cmd) => {
    context.subscriptions.push(vscode.commands.registerCommand(cmd, wrapExtensionCommand(commands[cmd], cmd)))
  })
}

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start Extension Test Suite.')

  test('Command registration and execution', async () => {
    const context = new MockExtensionContext()
    const refreshStub = sinon.stub()
    const codacyCloud = { refresh: refreshStub } as unknown as CodacyCloud
    await testRegisterCommands(context, codacyCloud)
    await vscode.commands.executeCommand('codacy.refresh')
    sinon.assert.calledOnce(refreshStub)
  })

  test('Activation and deactivation flows', async () => {
    const context = new MockExtensionContext()
    const appendLineStub = sinon.stub(Logger, 'appendLine')
    await activate(context)
    sinon.assert.calledWith(appendLineStub, sinon.match('Codacy extension activated'))
    deactivate()
    sinon.assert.calledWith(appendLineStub, sinon.match('Codacy extension deactivated'))
    appendLineStub.restore()
  })

  test('Integration with Git provider and CodacyCloud', async () => {
    // Mock repository
    const repo = { rootUri: { fsPath: '/mock' }, state: { HEAD: {}, remotes: [] } } as any

    // Mock CodacyCloud
    const codacyCloud = { open: sinon.stub() } as any

    // Mock GitProvider with event emitter
    const EventEmitter = require('events')
    const openEmitter = new EventEmitter()
    const gitProvider = {
      onDidOpenRepository: (cb: any) => { openEmitter.on('open', cb) },
      repositories: [repo],
      dispose: () => {},
    }

    // Simulate event registration
    gitProvider.onDidOpenRepository((r: any) => codacyCloud.open(r))

    // Simulate opening a repository
    openEmitter.emit('open', repo)

    sinon.assert.calledWith(codacyCloud.open, repo)
  })

  test('Context setting for workspace and Git state', async () => {
    const context = new MockExtensionContext()
    const executeCommandStub = sinon.stub(vscode.commands, 'executeCommand')

    // Simulate no workspace folders
    sinon.stub(vscode.workspace, 'workspaceFolders').value(undefined)
    await import('../../extension').then(({ activate }) => activate(context))
    sinon.assert.calledWith(executeCommandStub, 'setContext', 'codacy:hasProject', false)

    // Simulate workspace folders present
    sinon.stub(vscode.workspace, 'workspaceFolders').value([{ uri: { fsPath: '/mock' } }])
    await import('../../extension').then(({ activate }) => activate(context))
    sinon.assert.calledWith(executeCommandStub, 'setContext', 'codacy:hasProject', true)

    executeCommandStub.restore()
  })
})
