import * as vscode from 'vscode'
import { MockExtensionContext } from '../mocks/MockExtensionContext'
import * as sinon from 'sinon'
import { CodacyCloud } from '../../git/CodacyCloud'
import { CommandType, wrapExtensionCommand } from '../../common/utils'

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
})
