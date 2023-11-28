import * as vscode from 'vscode'
import { Analytics } from '@segment/analytics-node'
import { EventProperties } from '@segment/analytics-core'
import { User } from '../api/client'

class TelemetryClient {
  private analytics: Analytics
  private userId: string | undefined

  constructor() {
    this.analytics = new Analytics({ writeKey: 'VDmIZDvkCOk6NdGYD22iHGrYtKi3YNWh' })
  }

  public identify(user: User) {
    if (!vscode.env.isTelemetryEnabled) return

    this.userId = user.id.toString()

    this.analytics.identify({
      userId: this.userId,
      traits: {
        createdAt: user.created,
      },
    })
  }

  public track(event: string, properties: EventProperties) {
    if (!vscode.env.isTelemetryEnabled) return

    if (this.userId) {
      this.analytics.track({
        userId: this.userId,
        event,
        properties,
      })
    }
  }
}

const Telemetry = new TelemetryClient()
export default Telemetry
