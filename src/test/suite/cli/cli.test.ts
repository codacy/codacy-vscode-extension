/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from 'assert'
import * as vscode from 'vscode'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { createCodacyConfig, getRegisteredDescriptors, writeCodacyConfig } from '@codacy/analysis-runner'
import { registerBuiltinAdapters } from '@codacy/analysis-adapters'
import { CodacyCli, onToolsInstalled } from '../../../cli/CodacyCli'
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
      ;(cli as any).updateConfig = async () => {
        calls.push('update')
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

    test('refreshes a matching remote config once per session, without reset or install', async () => {
      await writeConfig('remote')
      const cli = new CodacyCli(tmpRoot, mockProvider, mockOrg, mockRepo)
      ;(cli as any)._accountToken = 'token'
      const calls = instrument(cli)

      await cli.initialize()
      await cli.initialize()

      assert.deepStrictEqual(calls, ['update'])
    })

    test('refreshConfig pulls the remote config again', async () => {
      await writeConfig('remote')
      const cli = new CodacyCli(tmpRoot, mockProvider, mockOrg, mockRepo)
      ;(cli as any)._accountToken = 'token'
      const calls = instrument(cli)

      await cli.initialize()
      await cli.refreshConfig()

      assert.deepStrictEqual(calls, ['update', 'update'])
    })

    test('keeps the remote config when refreshing it fails', async () => {
      await writeConfig('remote')
      const cli = new CodacyCli(tmpRoot, mockProvider, mockOrg, mockRepo)
      ;(cli as any)._accountToken = 'token'
      const calls = instrument(cli)
      let attempts = 0
      ;(cli as any).updateConfig = async () => {
        attempts++
        throw new Error('offline')
      }

      await cli.initialize()
      await cli.initialize()

      assert.deepStrictEqual(calls, [])
      assert.ok(fs.existsSync(path.join(tmpRoot, '.codacy', 'codacy.config.json')))
      assert.strictEqual(attempts, 2, 'a failed refresh is retried by the next initialize')
    })

    test('reinstallDependencies waits for a setup run already in progress', async () => {
      const events: string[] = []
      const initializing = new CodacyCli(tmpRoot)
      ;(initializing as any).doInitialize = async () => {
        events.push('initialize:start')
        await new Promise((resolve) => setTimeout(resolve, 20))
        events.push('initialize:end')
      }
      const reinstalling = new CodacyCli(tmpRoot)
      ;(reinstalling as any).installDependencies = async () => {
        events.push('reinstall')
        return { capability: { ready: [], unavailable: [], checkedAt: '' }, errors: [] }
      }

      await Promise.all([initializing.initialize(), reinstalling.reinstallDependencies()])

      assert.deepStrictEqual(events, ['initialize:start', 'initialize:end', 'reinstall'])
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

  suite('Codacy folder', () => {
    test('recognizes files inside .codacy/ and nothing else', () => {
      const cli = new CodacyCli(mockRootPath)
      assert.strictEqual(cli.isInCodacyFolder(`${mockRootPath}/.codacy/generated/Semgrep/rules.yaml`), true)
      assert.strictEqual(cli.isInCodacyFolder('.codacy/codacy.config.json'), true)
      assert.strictEqual(cli.isInCodacyFolder(`${mockRootPath}/src/index.ts`), false)
      assert.strictEqual(cli.isInCodacyFolder(`${mockRootPath}/.codacy-other/file.ts`), false)
    })

    test('analyze skips files inside .codacy/ without running the analyzer', async () => {
      const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'codacy-cli-test-'))
      try {
        await writeCodacyConfig(tmpRoot, createCodacyConfig({ source: 'local', languages: [], tools: [] }))
        const cli = new CodacyCli(tmpRoot)
        let installed = false
        ;(cli as any).installMissingToolsInBackground = () => {
          installed = true
        }

        const results = await cli.analyze({ file: path.join(tmpRoot, '.codacy', 'codacy.config.json') })

        assert.deepStrictEqual(results, [])
        assert.strictEqual(installed, false)
      } finally {
        fs.rmSync(tmpRoot, { recursive: true, force: true })
      }
    })
  })

  suite('Tools that need a manual install', () => {
    const unavailable = (toolId: string, extra: Record<string, unknown> = {}) => ({
      toolId,
      displayName: toolId.toUpperCase(),
      reason: 'Not installed',
      ...extra,
    })
    const resultWith = (unavailableTools: any[], errors: any[] = []) =>
      ({ capability: { ready: [], unavailable: unavailableTools, checkedAt: '' }, errors }) as any

    let shown: string[]
    let originalShowWarning: typeof vscode.window.showWarningMessage

    setup(() => {
      shown = []
      originalShowWarning = vscode.window.showWarningMessage
      ;(vscode.window as any).showWarningMessage = async (message: string) => {
        shown.push(message)
        return undefined
      }
    })

    teardown(() => {
      ;(vscode.window as any).showWarningMessage = originalShowWarning
    })

    test('shows one notice per tool per session, for failed and manual-only installs', () => {
      const cli = new CodacyCli(mockRootPath)
      const result = resultWith(
        [
          unavailable('manual-a', { availableVia: 'manual-install' }),
          unavailable('failed-b'),
          unavailable('cloud-c', { availableVia: 'cloud' }),
        ],
        [{ toolId: 'failed-b', phase: 'toolInstall', kind: 'InstallError', message: 'Ruby not found', level: 'error' }]
      )

      ;(cli as any).notifyToolsNeedingManualInstall(result)
      ;(cli as any).notifyToolsNeedingManualInstall(result)

      assert.strictEqual(shown.length, 1)
      assert.ok(shown[0].includes('MANUAL-A') && shown[0].includes('FAILED-B'), shown[0])
      assert.ok(!shown[0].includes('CLOUD-C'), shown[0])
    })

    test('installs newly unavailable tools in the background, once per tool', async () => {
      const cli = new CodacyCli(mockRootPath)
      let installs = 0
      ;(cli as any).installDependencies = async () => {
        installs++
      }
      const result = resultWith([unavailable('bg-missing-1'), unavailable('bg-cloud-1', { availableVia: 'cloud' })])

      ;(cli as any).installMissingToolsInBackground(result)
      ;(cli as any).installMissingToolsInBackground(result)
      await new Promise((resolve) => setTimeout(resolve, 10))

      assert.strictEqual(installs, 1)
    })

    test('signals when a background install makes a tool available', async () => {
      const cli = new CodacyCli(mockRootPath)
      const installedResult = {
        capability: { ready: [{ toolId: 'bg-new-1' }], unavailable: [], checkedAt: '' },
        errors: [],
      }
      ;(cli as any).installDependencies = async () => installedResult
      let fired = 0
      const subscription = onToolsInstalled(() => fired++)
      try {
        ;(cli as any).installMissingToolsInBackground(resultWith([unavailable('bg-new-1')]))
        await new Promise((resolve) => setTimeout(resolve, 10))
      } finally {
        subscription.dispose()
      }

      assert.strictEqual(fired, 1)
    })

    test('retries tools whose background install crashed', async () => {
      const cli = new CodacyCli(mockRootPath)
      let installs = 0
      ;(cli as any).installDependencies = async () => {
        installs++
        throw new Error('runner crashed')
      }
      const result = resultWith([unavailable('bg-crash-1')])

      ;(cli as any).installMissingToolsInBackground(result)
      await new Promise((resolve) => setTimeout(resolve, 10))
      ;(cli as any).installMissingToolsInBackground(result)
      await new Promise((resolve) => setTimeout(resolve, 10))

      assert.strictEqual(installs, 2)
    })

    test('does not install when only cloud-only tools are unavailable', async () => {
      const cli = new CodacyCli(mockRootPath)
      let installs = 0
      ;(cli as any).installDependencies = async () => {
        installs++
      }

      ;(cli as any).installMissingToolsInBackground(
        resultWith([unavailable('only-cloud-1', { availableVia: 'cloud' })])
      )
      await new Promise((resolve) => setTimeout(resolve, 10))

      assert.strictEqual(installs, 0)
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
