const fs = require('fs')

// update OpenAPI.ts to support undefined in the promise
const openApiTs = fs.readFileSync('src/api/client/core/OpenAPI.ts', 'utf8')
const openApiTsUpdated = openApiTs.replace(/Promise<T>/g, 'Promise<T | undefined>')
fs.writeFileSync('src/api/client/core/OpenAPI.ts', openApiTsUpdated)

// update api/client/index.ts to export ApiError as CoreApiError
const indexTs = fs.readFileSync('src/api/client/index.ts', 'utf8')
const indexTsUpdated = indexTs.replace(/export { ApiError }/g, 'export { ApiError as CoreApiError }')
fs.writeFileSync('src/api/client/index.ts', indexTsUpdated)
