/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from 'assert'
import { getRegisteredDescriptors } from '@codacy/analysis-runner'
import { registerBuiltinAdapters } from '@codacy/analysis-adapters'
import { CodacyCli } from '../../../cli/CodacyCli'
import { processSarifResults } from '../../../cli/utils'

suite('CLI Tests', () => {
  const mockRootPath = '/mock/root/path'
  const mockProvider = 'gh'
  const mockOrg = 'test-org'
  const mockRepo = 'test-repo'

  suite('Adapter registration', () => {
    test('registerBuiltinAdapters populates the runner registry', () => {
      registerBuiltinAdapters()
      const descriptors = getRegisteredDescriptors()
      assert.ok(descriptors.length > 0, 'expected built-in adapters to be registered')
    })

    test('registers the eslint-9 adapter', () => {
      registerBuiltinAdapters()
      const ids = getRegisteredDescriptors().map((d: any) => String(d.id).toLowerCase())
      assert.ok(
        ids.some((id: string) => id.includes('eslint')),
        `expected an eslint adapter, got: ${ids.join(', ')}`
      )
    })
  })

  suite('SARIF processing', () => {
    test('maps SARIF runs into ProcessedSarifResult entries', () => {
      const runs = [
        {
          tool: {
            driver: {
              name: 'eslint',
              rules: [{ id: 'no-unused-vars', name: 'no-unused-vars', helpUri: 'https://example.com' }],
            },
          },
          results: [
            {
              ruleId: 'no-unused-vars',
              level: 'warning',
              message: { text: 'x is unused' },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: 'src/index.ts' },
                    region: { startLine: 1 },
                  },
                },
              ],
            },
          ],
        },
      ]

      const results = processSarifResults(runs as any)
      assert.strictEqual(results.length, 1)
      assert.strictEqual(results[0].tool, 'eslint')
      assert.strictEqual(results[0].filePath, 'src/index.ts')
      assert.strictEqual(results[0].rule?.id, 'no-unused-vars')
    })
  })

  suite('Path safety', () => {
    let cli: CodacyCli

    setup(() => {
      cli = new CodacyCli(mockRootPath, mockProvider, mockOrg, mockRepo)
    })

    test('converts an absolute in-workspace path to a repo-relative path', () => {
      const rel = (cli as any).toRepoRelativePath(`${mockRootPath}/src/index.ts`)
      assert.strictEqual(rel, 'src/index.ts')
    })

    test('rejects path traversal outside the workspace', () => {
      assert.throws(() => (cli as any).toRepoRelativePath('../../etc/passwd'))
    })

    test('rejects a sibling directory sharing a prefix with the workspace root', () => {
      assert.throws(() => (cli as any).toRepoRelativePath(`${mockRootPath}-sibling/file.js`))
    })

    test('rejects paths containing null bytes', () => {
      assert.throws(() => (cli as any).toRepoRelativePath('src/index\0.ts'))
    })
  })
})
