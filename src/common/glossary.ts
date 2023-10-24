import { SeverityLevel } from '../api/client'
import { Reason } from './types'

export const SEVERITY_LEVEL_MAP: { [key in SeverityLevel]: string } = {
  Info: 'Minor',
  Warning: 'Medium',
  Error: 'Critical',
}

export const REASON_MAP: Record<Reason, { label: string; icon: string; sign: string }> = {
  issueThreshold: {
    label: 'Issues',
    icon: 'bug',
    sign: '>',
  },
  securityIssueThreshold: {
    label: 'Security Issues',
    icon: 'shield',
    sign: '>',
  },
  duplicationThreshold: {
    label: 'Duplication',
    icon: 'versions',
    sign: '>',
  },
  complexityThreshold: {
    label: 'Complexity',
    icon: 'type-hierarchy',
    sign: '>',
  },
  coverageThreshold: {
    label: 'Coverage Variation',
    icon: 'beaker',
    sign: '<',
  },
  diffCoverageThreshold: {
    label: 'Diff Coverage',
    icon: 'beaker',
    sign: '<',
  },
}
