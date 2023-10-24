export const KNOWN_REASONS = [
  'issueThreshold',
  'securityIssueThreshold',
  'duplicationThreshold',
  'complexityThreshold',
  'coverageThreshold',
  'diffCoverageThreshold',
] as const
export type Reason = (typeof KNOWN_REASONS)[number]
