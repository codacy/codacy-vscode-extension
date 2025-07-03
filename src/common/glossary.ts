import { SeverityLevel } from '../api/client'
import { Reason } from './types'

interface TreeViewMeta {
  label: string
  icon?: string
  order?: number
}

export const SEVERITY_LEVEL_MAP: { [key in SeverityLevel]: TreeViewMeta } = {
  Info: {
    label: 'Minor',
    icon: 'info',
    order: 4,
  },
  Warning: {
    label: 'Medium',
    icon: 'warning',
    order: 3,
  },
  High: {
    label: 'High',
    icon: 'error',
    order: 2,
  },
  Error: {
    label: 'Critical',
    icon: 'flame',
    order: 1,
  },
}

export type CodePatternCategory =
  | 'ErrorProne'
  | 'CodeStyle'
  | 'UnusedCode'
  | 'Compatibility'
  | 'Security'
  | 'Performance'
  | 'Complexity'
  | 'Documentation'
  | 'BestPractice'
  | 'Comprehensibility'

export const CATEGORY_LEVEL_MAP: { [key in CodePatternCategory]: TreeViewMeta } = {
  ErrorProne: {
    label: 'Error Prone',
    icon: 'bug',
    order: 2,
  },
  CodeStyle: {
    label: 'Code Style',
    icon: 'code',
    order: 9,
  },
  UnusedCode: {
    label: 'Unused Code',
    icon: 'code',
    order: 6,
  },
  Compatibility: {
    label: 'Compatibility',
    icon: 'code',
    order: 5,
  },
  Security: {
    label: 'Security',
    icon: 'shield',
    order: 1,
  },
  Performance: {
    label: 'Performance',
    icon: 'code',
    order: 3,
  },
  Complexity: {
    label: 'Code Complexity',
    icon: 'code',
    order: 4,
  },
  Documentation: {
    label: 'Documentation',
    icon: 'code',
    order: 10,
  },
  BestPractice: {
    label: 'Best Practice',
    icon: 'code',
    order: 7,
  },
  Comprehensibility: {
    label: 'Comprehensibility',
    icon: 'code',
    order: 8,
  },
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
