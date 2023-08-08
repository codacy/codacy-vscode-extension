import { Api } from '../api/ApiClient'
import Logger from '../common/logger'

export const signIn = async () => {
  Logger.appendLine('Oh Hi Mark!')
  console.log('Ohhhh Hiiiii Mark!')

  try {
    const res = await Api.Configuration.getConfigurationStatus()
    Logger.appendLine(JSON.stringify(res))
  } catch (e) {
    Logger.appendLine(JSON.stringify(e))
  }
}
