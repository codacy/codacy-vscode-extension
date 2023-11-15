const fs = require('fs')

// update OpenAPI.ts to support undefined in the promise
const openApiTs = fs.readFileSync('src/api/client/core/OpenAPI.ts', 'utf8')
const openApiTsUpdated = openApiTs.replace(/Promise<T>/g, 'Promise<T | undefined>')
fs.writeFileSync('src/api/client/core/OpenAPI.ts', openApiTsUpdated)

// update api/client/index.ts to export ApiError as CoreApiError
const indexTs = fs.readFileSync('src/api/client/index.ts', 'utf8')
const indexTsUpdated = indexTs.replace(/export { ApiError }/g, 'export { ApiError as CoreApiError }')
fs.writeFileSync('src/api/client/index.ts', indexTsUpdated)

// TODO: check why some types are left empty

const pdBefore = `export type PatternDetails = {
};`

const pdAfter = `export type PatternDetails = {
  id: string
  title?: string
  category: string
  subCategory?: string
  severityLevel: 'Info' | 'Warning' | 'Error'
}`

const patternDetails = fs.readFileSync('src/api/client/models/PatternDetails.ts', 'utf8')
const patternDetailsUpdated = patternDetails.replace(pdBefore, pdAfter)
fs.writeFileSync('src/api/client/models/PatternDetails.ts', patternDetailsUpdated)

// ---

const trBefore = `export type ToolReference = {
};`

const trAfter = `export type ToolReference = {
  uuid: string
  name: string
}`

const toolReference = fs.readFileSync('src/api/client/models/ToolReference.ts', 'utf8')
const toolReferenceUpdated = toolReference.replace(trBefore, trAfter)
fs.writeFileSync('src/api/client/models/ToolReference.ts', toolReferenceUpdated)

// ----

const rwaBefore = `export type RepositoryWithAnalysis = {
};`

const rwaAfter = `export type RepositoryWithAnalysis = {
  lastAnalysedCommit?: Commit
  grade?: number
  gradeLetter?: string
  issuesPercentage?: number
  complexFilesPercentage?: number
  duplicationPercentage?: number
  repository: Repository
  branch?: Branch
  selectedBranch?: Branch
  coverage?: Coverage
}`

const repositoryWithAnalysis = fs.readFileSync('src/api/client/models/RepositoryWithAnalysis.ts', 'utf8')
const repositoryWithAnalysisUpdated = repositoryWithAnalysis.replace(rwaBefore, rwaAfter)
fs.writeFileSync('src/api/client/models/RepositoryWithAnalysis.ts', repositoryWithAnalysisUpdated)

// update api/client/core/request.ts to fix FormData instanceof problem

const crBefore = `export const isFormData = (value: any): value is FormData => {
  return value instanceof FormData;
};`

const crAfter = `export const isFormData = (value: any): value is FormData => {
  try {
    return value instanceof FormData
  } catch (e) {
    return false
  }
};`

const coreRequest = fs.readFileSync('src/api/client/core/request.ts', 'utf8')
const coreRequestUpdated = coreRequest.replace(crBefore, crAfter)
fs.writeFileSync('src/api/client/core/request.ts', coreRequestUpdated)
