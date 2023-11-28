import { Api } from '../api'
import { User } from '../api/client'
import Logger from '../common/logger'

export class Account {
  private static _current: User | undefined

  static async current() {
    if (!Account._current) {
      try {
        const { data } = await Api.Account.getUser()
        Account._current = data
      } catch (e) {
        Logger.error('Failed to get user', (e as Error).message)
      }
    }
    return Account._current
  }

  static async emails() {
    const user = await Account.current()

    if (!user) return []

    return [user.mainEmail, ...(user?.otherEmails || [])]
  }

  static clear() {
    Account._current = undefined
  }
}
