import { Api } from '../api'
import Logger from '../common/logger'

export const signIn = async () => {
  // TODO: Implement signIn
  try {
    const res = await Api.Account.getUser()
    Logger.appendLine(JSON.stringify(res))
  } catch (e) {
    Logger.appendLine(JSON.stringify(e))
  }
}
