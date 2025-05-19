import * as vscode from 'vscode'
import { Analytics } from '@segment/analytics-node'
import { EventProperties } from '@segment/analytics-core'
import { User } from '../api/client'
import { SEGMENT_WRITE_KEY } from '../env-secrets'

class TelemetryClient {
  private analytics: Analytics | undefined
  private userId: string | undefined

  constructor() {
    if (SEGMENT_WRITE_KEY) {
      this.analytics = new Analytics({ writeKey: SEGMENT_WRITE_KEY })
    }
  }

  public identify(user: User) {
    if (!vscode.env.isTelemetryEnabled || !this.analytics) return

    this.userId = user.id.toString()

    this.analytics.identify({
      userId: this.userId,
      traits: {
        createdAt: user.created,
      },
    })
  }

  public track(event: string, properties: EventProperties) {
    if (!vscode.env.isTelemetryEnabled || !this.analytics) return

    if (this.userId) {
      this.analytics.track({
        userId: this.userId,
        event,
        properties: {
          ide: vscode.env.appName.toLowerCase(),
          os: process.platform,
          ...properties,
        },
      })
    }
  }
}

const Telemetry = new TelemetryClient()
export default Telemetry
