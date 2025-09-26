import * as vscode from 'vscode'
import { Analytics } from '@segment/analytics-node'
import { EventProperties } from '@segment/analytics-core'
import { Organization, User } from '../api/client'
import { SEGMENT_WRITE_KEY } from '../env-secrets'
import { v4 as uuidv4 } from 'uuid'

class TelemetryClient {
  private analytics: Analytics | undefined
  private userId: string | undefined
  private anonymousId: string | undefined
  private organization: Organization | undefined

  constructor() {
    if (SEGMENT_WRITE_KEY) {
      this.analytics = new Analytics({ writeKey: SEGMENT_WRITE_KEY })
    }
  }

  public init(context: vscode.ExtensionContext) {
    // Get or create anonymous ID
    this.anonymousId = context.globalState.get<string>('codacy.anonymousId')
    if (!this.anonymousId) {
      this.anonymousId = uuidv4()
      context.globalState.update('codacy.anonymousId', this.anonymousId)
    }
  }

  public identify(user: User, organization?: Organization) {
    if (!vscode.env.isTelemetryEnabled || !this.analytics || !this.anonymousId) return

    this.userId = user.id.toString()
    this.organization = organization

    this.analytics.identify({
      userId: this.userId,
      anonymousId: this.anonymousId,
      traits: {
        createdAt: user.created,
      },
    })
  }

  public track(event: string, properties: EventProperties) {
    if (!vscode.env.isTelemetryEnabled || !this.analytics || !this.anonymousId) return

    this.analytics.track({
      userId: this.userId,
      anonymousId: this.anonymousId,
      event,
      properties: {
        ide: vscode.env.appName.toLowerCase(),
        os: process.platform,
        organization: this.organization?.name,
        provider: this.organization?.provider,
        organization_id: this.organization?.identifier,
        ...properties,
      },
    })
  }
}

const Telemetry = new TelemetryClient()
export default Telemetry
