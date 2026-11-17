/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from 'assert'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { createCodacyConfig, getRegisteredDescriptors, writeCodacyConfig } from '@codacy/analysis-runner'
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

  suite('Initialization lifecycle', () => {
    let tmpRoot: string

    /** Stubs the expensive steps and records which of them ran. */
    const instrument = (cli: CodacyCli) => {
      const calls: string[] = []
      ;(cli as any).regenerateConfig = async () => {
        calls.push('regenerate')
      }
      ;(cli as any).installDependencies = async () => {
        calls.push('install')
      }
      ;(cli as any).setup = async () => {
        calls.push('setup')
      }
      ;(cli as any).preflightCodacyCli = async () => {
        calls.push('preflight')
      }
      return calls
    }

    const writeConfig = async (source: 'remote' | 'local') => {
      await writeCodacyConfig(tmpRoot, createCodacyConfig({ source, languages: [], tools: [] }))
    }

    setup(() => {
      tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'codacy-cli-test-'))
    })

    teardown(() => {
      fs.rmSync(tmpRoot, { recursive: true, force: true })
    })

    test('keeps a remote config when the instance has no identification', async () => {
      await writeConfig('remote')
      const cli = new CodacyCli(tmpRoot)
      const calls = instrument(cli)

      await cli.initialize()

      assert.deepStrictEqual(calls, [])
    })

    test('upgrades a local config to remote once the repository is identified', async () => {
      await writeConfig('local')
      const cli = new CodacyCli(tmpRoot, mockProvider, mockOrg, mockRepo)
      ;(cli as any)._accountToken = 'token'
      const calls = instrument(cli)

      await cli.initialize()

      assert.deepStrictEqual(calls, ['regenerate', 'install'])
    })

    test('leaves a matching remote config alone', async () => {
      await writeConfig('remote')
      const cli = new CodacyCli(tmpRoot, mockProvider, mockOrg, mockRepo)
      ;(cli as any)._accountToken = 'token'
      const calls = instrument(cli)

      await cli.initialize()

      assert.deepStrictEqual(calls, [])
    })

    test('serializes concurrent initialize calls across instances', async () => {
      const events: string[] = []
      const slowInstance = (name: string) => {
        const cli = new CodacyCli(tmpRoot)
        ;(cli as any).doInitialize = async () => {
          events.push(`${name}:start`)
          await new Promise((resolve) => setTimeout(resolve, 20))
          events.push(`${name}:end`)
        }
        return cli
      }

      await Promise.all([slowInstance('a').initialize(), slowInstance('b').initialize()])

      assert.deepStrictEqual(events, ['a:start', 'a:end', 'b:start', 'b:end'])
    })

    test('analyze does not run setup or re-initialization', async () => {
      const cli = new CodacyCli(tmpRoot)
      const calls = instrument(cli)

      await assert.rejects(() => cli.analyze({ file: path.join(tmpRoot, 'index.ts') }))

      assert.deepStrictEqual(calls, [])
    })

    test('configDiscover is a no-op before local analysis is set up', async () => {
      const cli = new CodacyCli(tmpRoot)
      const calls = instrument(cli)

      await cli.configDiscover(path.join(tmpRoot, 'new-file.ts'))

      assert.deepStrictEqual(calls, [])
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
