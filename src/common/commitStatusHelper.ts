// Copied from commitStatusHelper.ts in the frontend repository

import { differenceInHours, isAfter } from 'date-fns'
import {
  Commit,
  CommitWithAnalysis,
  CoverageAnalysis,
  CoveragePullRequestResponse,
  PullRequestCoverage,
  PullRequestWithAnalysis,
  QualityAnalysis,
} from '../api/client'

export interface StatusProps {
  value: 'loading' | 'passed' | 'failed' | 'noInformation'
  message: string
  details?: string

  // VSCODE Custom Props
  icon?: string
  colorId?: string
}

/** COVERAGE */

const REPORTS_WAIT_TIME = 3 // hours

const CoverageStatus: Record<string, StatusProps> = {
  waiting: { value: 'loading', message: 'Pending...', icon: 'loading~spin' },
  passed: { value: 'passed', message: 'Up to coverage standards.', icon: 'pass', colorId: 'testing.iconPassed' },
  failed: { value: 'failed', message: 'Not up to coverage standards.', icon: 'error', colorId: 'testing.iconFailed' },
  noCoverage: { value: 'noInformation', message: 'No information.', icon: 'circle-slash' },
}

const getCoverageStatus = (
  isWaitingForAnalysis: boolean,
  lastUpdated: string,
  coverage?: PullRequestCoverage | CoverageAnalysis
) => {
  const isRecentlyUpdated = differenceInHours(new Date(), new Date(lastUpdated)) <= REPORTS_WAIT_TIME

  const status = isWaitingForAnalysis
    ? isRecentlyUpdated
      ? 'waiting'
      : 'noCoverage'
    : coverage?.isUpToStandards ||
      coverage?.resultReasons?.length === 0 ||
      !coverage?.resultReasons?.some((reason) => !reason.isUpToStandards)
    ? 'passed'
    : 'failed'

  return status
}

export const isCommitBeingAnalysed = (commit: Commit) =>
  !!commit?.startedAnalysis &&
  (!commit.endedAnalysis || isAfter(new Date(commit.startedAnalysis), new Date(commit.endedAnalysis)))

export const getCoverageCommitStatus = (data: CommitWithAnalysis) => {
  const isWaitingForAnalysis = !data.commit.endedAnalysis || !data.coverage?.totalCoveragePercentage

  const status = getCoverageStatus(isWaitingForAnalysis, data.commit.commitTimestamp, data.coverage)
  return CoverageStatus[status]
}

const isWaitingForCoverageResults = (data: PullRequestWithAnalysis) =>
  data.isAnalysing ||
  (data.coverage?.deltaCoverage === undefined &&
    (data.coverage?.diffCoverage === undefined ||
      (data.coverage?.diffCoverage?.value === undefined &&
        data.coverage?.diffCoverage?.cause === 'MissingRequirements')))

export const getCoveragePRStatus = (data: PullRequestWithAnalysis, reports?: CoveragePullRequestResponse) => {
  const status = getCoverageStatus(isWaitingForCoverageResults(data), data.pullRequest.updated, data.coverage)

  const result = CoverageStatus[status]

  if (reports?.data) {
    // with extra information about the reports, decorate the status with more information
    const { headCommit, commonAncestorCommit } = reports.data

    if (status === 'waiting') {
      if (headCommit.reports.length === 0) return { ...result, details: 'Waiting for coverage reports...' }
      if (headCommit.reports.length > 0 && commonAncestorCommit.reports.length > 0)
        return { ...result, details: 'Processing coverage reports...' }
    } else if (status === 'noCoverage') {
      if (headCommit.reports.length === 0 || commonAncestorCommit.reports.length === 0)
        return { ...result, details: 'Missing coverage reports' }
      else return { ...result, details: "Couldn't process coverage" }
    }
  }

  return result
}

/** QUALITY */

const QualityStatus: Record<string, StatusProps> = {
  waiting: { value: 'loading', message: 'Analysing...', icon: 'loading~spin' },
  passed: { value: 'passed', message: 'Up to quality standards.', icon: 'pass', colorId: 'testing.iconPassed' },
  failed: { value: 'failed', message: 'Not up to quality standards.', icon: 'error', colorId: 'testing.iconFailed' },
  noInfo: { value: 'noInformation', message: 'No information.', icon: 'circle-slash' },
}

const getQualityStatusValue = (isWaitingForAnalysis: boolean, isAnalyzable: boolean, quality?: QualityAnalysis) => {
  const status = isWaitingForAnalysis
    ? !isAnalyzable
      ? 'noInfo'
      : 'waiting'
    : quality?.isUpToStandards === undefined || !isAnalyzable
    ? 'noInfo'
    : quality.isUpToStandards ||
      quality.resultReasons?.length === 0 ||
      !quality.resultReasons?.some((reason) => !reason.isUpToStandards)
    ? 'passed'
    : 'failed'

  return status
}

const getQualityCommonStatus = (
  data: CommitWithAnalysis | PullRequestWithAnalysis,
  isWaitingForAnalysis: boolean,
  isWaitingForCoverage: boolean,
  isAnalyzable: boolean,
  lastUpdated: string,
  expectCoverage: boolean
) => {
  const qualityStatus = getQualityStatusValue(isWaitingForAnalysis, isAnalyzable, data.quality)

  const coverageStatus = expectCoverage
    ? getCoverageStatus(isWaitingForCoverage, lastUpdated, data.coverage)
    : undefined

  const useCoverageStatus = expectCoverage && qualityStatus !== 'failed' && coverageStatus === 'failed'
  const status = useCoverageStatus ? coverageStatus : qualityStatus

  const result = {
    ...(useCoverageStatus ? CoverageStatus[status] : QualityStatus[status]),
    quality: QualityStatus[qualityStatus],
    ...(coverageStatus ? { coverage: CoverageStatus[coverageStatus] } : undefined),
  }

  if (result.coverage && qualityStatus === 'passed' && coverageStatus !== 'passed') {
    switch (coverageStatus) {
      case 'waiting':
        return { ...result, details: 'Waiting for coverage reports...' }
      case 'noCoverage':
        return { ...result, details: 'Missing coverage reports' }
    }
  }

  if (status === 'noInfo' && data.meta.reason) {
    return { ...result, details: data.meta.reason }
  }

  return result
}

export const getQualityStatus = (data: CommitWithAnalysis | PullRequestWithAnalysis, expectCoverage: boolean) =>
  'pullRequest' in data ? getQualityPRStatus(data, expectCoverage) : getQualityCommitStatus(data, expectCoverage)

export type QualityStatusResponse = ReturnType<typeof getQualityStatus>

export const getQualityCommitStatus = (data: CommitWithAnalysis, expectCoverage: boolean) =>
  getQualityCommonStatus(
    data,
    isCommitBeingAnalysed(data.commit),
    !data.coverage?.totalCoveragePercentage,
    data.meta.analyzable && !!data.commit.endedAnalysis && !!data.commit.startedAnalysis,
    data.commit.commitTimestamp,
    expectCoverage
  )

export const getQualityPRStatus = (data: PullRequestWithAnalysis, expectCoverage: boolean) =>
  getQualityCommonStatus(
    data,
    data.isAnalysing,
    isWaitingForCoverageResults(data),
    data.meta.analyzable,
    data.pullRequest.updated,
    expectCoverage
  )
