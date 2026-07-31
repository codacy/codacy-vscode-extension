import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import {
  analyze as runnerAnalyze,
  formatOutput,
  getRegisteredAdapters,
  getRegisteredDescriptors,
  initAutoConfig,
  initRemoteConfig,
  configureApiToken,
  configureProxy,
  writeCodacyConfig,
  readCodacyConfig,
  readBaselineConfig,
  writeBaselineConfig,
  updateConfigIncremental,
  mergeConfigs,
  createLogger,
} from '@codacy/analysis-runner'
import { registerBuiltinAdapters, loadUnsupportedPatterns } from '@codacy/analysis-adapters'
import type { Logger as RunnerLogger, CodacyConfig } from '@codacy/tooling'

import { Config } from '../common/config'
import { buildProxyEnv, buildProxyConfig } from '../common/proxy'
import { cleanErrorMessage, CodacyError } from '../common/utils'
import Logger from '../common/logger'
import { ProcessedSarifResult, processSarifResults } from './utils'

export const CODACY_FOLDER_NAME = '.codacy'
export const CODACY_CONFIG_FILE = 'codacy.config.json'

/**
 * Drives Codacy local analysis in-process via `@codacy/analysis-runner`.
 *
 * This replaces the previous approach of downloading a `cli.sh` shell script and
 * shelling out to it. Because the runner is a Node library, a single class works
 * on every platform (including Windows without WSL) — there are no longer any
 * platform-specific subclasses.
 *
 * Because the analyzer ships with the extension, "ready" no longer means "a script
 * was downloaded" — it means the repository has been initialized with a
 * `.codacy/codacy.config.json`. `isInitialized()` exposes that state.
 */
export class CodacyCli {
  public readonly _accountToken = Config.apiToken

  public readonly rootPath: string
  public readonly provider?: string
  public readonly organization?: string
  public readonly repository?: string

  private _proxyEnvApplied = false

  constructor(rootPath: string, provider?: string, organization?: string, repository?: string) {
    this.rootPath = rootPath
    this.provider = provider
    this.organization = organization
    this.repository = repository

    // Populate the runner's tool adapter registry (idempotent).
    registerBuiltinAdapters()

    this.updateReadyContext()
  }

  // --- readiness -------------------------------------------------------------

  /** Whether the repository has been initialized (a Codacy config file exists). */
  public isInitialized(): boolean {
    return this.configExists()
  }

  /** Keeps the `codacy:localAnalysisReady` UI context in sync with {@link isInitialized}. */
  private updateReadyContext(): void {
    vscode.commands.executeCommand('setContext', 'codacy:localAnalysisReady', this.configExists())
  }

  // --- helpers ---------------------------------------------------------------

  private configPath(): string {
    return path.join(this.rootPath, CODACY_FOLDER_NAME, CODACY_CONFIG_FILE)
  }

  private configExists(): boolean {
    return fs.existsSync(this.configPath())
  }

  /** True when we have everything needed to pull configuration from Codacy Cloud. */
  private hasIdentification(): boolean {
    return !!(this._accountToken && this.provider && this.organization && this.repository)
  }

  /**
   * Whether we should avoid regenerating the config. Skip when the existing config
   * was sourced remotely but we currently lack identification parameters — otherwise
   * we would silently downgrade a remote config to a locally-detected one.
   */
  private async shouldSkipReconfig(): Promise<boolean> {
    if (this.hasIdentification()) return false
    const config = await readCodacyConfig(this.rootPath).catch(() => null)
    return config?.metadata?.source === 'remote'
  }

  /**
   * Makes proxy / CA settings visible to the runner and the tools it spawns.
   *
   * Two layers, because the runner runs in-process here but also spawns tools:
   *  - Tool subprocesses inherit `process.env`, so the standard proxy vars route
   *    their network access. Node-level TLS vars (NODE_EXTRA_CA_CERTS) are read
   *    at process startup, so they only benefit spawned child processes.
   *  - The runner's own outbound `fetch` (Codacy API calls and tool/runtime
   *    downloads) goes through undici's global dispatcher, which does not read
   *    proxy env vars. `configureProxy` installs that dispatcher from the resolved
   *    VS Code settings — mirroring how {@link buildConfig} calls `configureApiToken`.
   */
  private applyProxyEnv(): void {
    if (this._proxyEnvApplied) return
    this._proxyEnvApplied = true
    Object.assign(process.env, buildProxyEnv())
    configureProxy(buildProxyConfig())
  }

  /** Runner logger that forwards human-readable messages to the extension output. */
  private createRunnerLogger(): RunnerLogger {
    return createLogger({
      fileEnabled: false,
      onStderrMessage: (text) => Logger.debug(text),
    })
  }

  /** Builds a fresh CodacyConfig using remote (if identified) or local auto-detection. */
  private async buildConfig(): Promise<CodacyConfig> {
    this.applyProxyEnv()
    const adapters = await getRegisteredAdapters()

    if (this.hasIdentification()) {
      configureApiToken(this._accountToken!)
      const { config } = await initRemoteConfig(
        this.rootPath,
        this.provider!,
        this.organization!,
        this.repository!,
        adapters,
        this._accountToken!
      )
      return config
    }

    const descriptors = getRegisteredDescriptors()
    // `loadUnsupportedPatterns` (from the adapters preset) gates stack-specific
    // patterns during auto-detection. The intermediate optional args (filters,
    // onDiscoveryComplete, rawFilterString) are left at their defaults.
    const { config } = await initAutoConfig(
      this.rootPath,
      adapters,
      descriptors,
      undefined,
      undefined,
      undefined,
      loadUnsupportedPatterns
    )
    return config
  }

  // --- public lifecycle ------------------------------------------------------

  public async preflightCodacyCli(autoInstall: boolean): Promise<void> {
    this.updateReadyContext()

    if (this.configExists()) {
      await this.initialize()
      return
    }

    if (autoInstall) await this.setup()
  }

  /**
   * "Set up local analysis" action: generates the repository config and downloads any
   * tool dependencies, with progress UI.
   *
   * @param options.showSuccessMessage Whether to surface the "ready!" notification on
   *   success. The setup view drives this initialization automatically in the
   *   background, so it opts out of the notification and shows an inline spinner
   *   instead.
   */
  public async setup(options: { showSuccessMessage?: boolean } = {}): Promise<void> {
    const { showSuccessMessage = true } = options

    await vscode.commands.executeCommand('setContext', 'codacy:localAnalysisSetupInProgress', true)

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Window,
        title: 'Setting up Codacy local analysis',
        cancellable: false,
      },
      async () => {
        try {
          await this.initialize()
          if (showSuccessMessage) {
            vscode.window.showInformationMessage('Codacy local analysis is ready!')
          }
        } catch (error) {
          const cleanedErrorMessage = cleanErrorMessage(error, this._accountToken)
          Logger.error(`Failed to set up Codacy local analysis: ${cleanedErrorMessage}`)
          throw new Error(`Failed to set up Codacy local analysis: ${cleanedErrorMessage}`)
        } finally {
          await vscode.commands.executeCommand('setContext', 'codacy:localAnalysisSetupInProgress', false)
        }
      }
    )
  }

  public async installDependencies(): Promise<void> {
    this.applyProxyEnv()
    try {
      // "auto-install" downloads any missing runtimes/tools before analysis.
      await runnerAnalyze({
        repositoryRoot: this.rootPath,
        mode: 'auto-install',
        logger: this.createRunnerLogger(),
      })
    } catch (error) {
      const cleanedErrorMessage = cleanErrorMessage(error, this._accountToken)
      throw new Error(`Failed to install dependencies: ${cleanedErrorMessage}`)
    }
  }

  public async initialize(): Promise<void> {
    const devMode = Config.devMode
    const configExists = this.configExists()

    let needsInitialization = !configExists

    if (configExists && !devMode) {
      // Regenerate if the repo's identification state no longer matches the config
      // (e.g. it was created remotely but we now lack a token, or vice versa).
      const config = await readCodacyConfig(this.rootPath).catch(() => null)
      const isRemote = config?.metadata?.source === 'remote'
      if (isRemote !== this.hasIdentification()) {
        needsInitialization = true
      }
    }

    if (!needsInitialization) {
      if (devMode) {
        await this.installDependencies()
        Logger.debug('Dev mode enabled. Skipping initialization.')
      }
      this.updateReadyContext()
      return
    }

    try {
      await this.regenerateConfig()
    } catch (error) {
      const cleanedErrorMessage = cleanErrorMessage(error, this._accountToken)
      throw new Error(`Failed to initialize CLI: ${cleanedErrorMessage}`)
    }

    // Fetch any missing runtimes/tools for the freshly generated config.
    await this.installDependencies()
  }

  /**
   * Writes the live config plus its baseline snapshot.
   *
   * The baseline (`codacy.config.baseline.json`, committed alongside the config) is
   * always the *exact generator output* — never the merged/edited result — so the
   * next {@link updateConfig} can tell a user-disabled pattern apart from a
   * default-off one. On a full regenerate `config === baseline`; on an incremental
   * update `config` is the merge result while `baseline` is the fresh generation.
   */
  private async writeConfigAndBaseline(config: CodacyConfig, baseline: CodacyConfig): Promise<void> {
    // writeCodacyConfig writes the live config to `.codacy/codacy.config.json`
    // (creating the directory if needed) and also ensures `.codacy/.gitignore`, so
    // the generated tool configs under `.codacy/generated/` stay untracked.
    await writeCodacyConfig(this.rootPath, config)
    // writeBaselineConfig writes the generator-output snapshot to
    // `.codacy/codacy.config.baseline.json` — a sibling of the config that is meant
    // to be committed. It has no `.codacy/` side effects (no .gitignore handling);
    // it just persists the exact `next` so the following updateConfig() can diff
    // against it and tell user-disabled patterns apart from default-off ones.
    await writeBaselineConfig(this.rootPath, baseline)
    this.updateReadyContext()
  }

  /**
   * Rebuilds the Codacy config from scratch, discarding any local edits (the
   * `--reset` path). Used for first-time init and when the identification state
   * changes (remote↔local), where the previous config no longer applies.
   */
  private async regenerateConfig(): Promise<void> {
    const config = await this.buildConfig()
    await this.writeConfigAndBaseline(config, config)
  }

  /**
   * Incrementally updates the config, preserving local edits — the `update-config`
   * default. Re-runs the original init mode to produce `next`, then three-way merges
   * it into the current config against the committed baseline: newly-detected
   * languages/frameworks add tools/patterns, stack elements that disappeared are
   * removed, and user edits (disabled patterns, tuned parameters, custom excludes)
   * survive.
   *
   * - Remote configs are authoritative: they are re-synced wholesale from Codacy
   *   Cloud, with no local-edit preservation.
   * - When no baseline snapshot exists (a config predating baselines), we cannot
   *   distinguish user-disabled patterns from default-off ones, so we fall back to
   *   an additive merge (edits kept, stale tools not pruned) and warn.
   */
  private async updateConfig(): Promise<void> {
    const next = await this.buildConfig()

    if (next.metadata?.source === 'remote') {
      await this.writeConfigAndBaseline(next, next)
      return
    }

    const [base, current] = await Promise.all([
      readBaselineConfig(this.rootPath).catch(() => null),
      readCodacyConfig(this.rootPath).catch(() => null),
    ])

    let result: CodacyConfig
    if (base && current) {
      result = updateConfigIncremental(base, current, next)
    } else if (current) {
      Logger.warn(
        'No Codacy config baseline snapshot found; performing an additive merge ' +
          '(local edits are kept, but tools for a removed language/framework are not pruned).'
      )
      // dest = current so the user's edits win; preferDestParameters keeps their
      // tuned parameters over freshly-generated defaults.
      result = mergeConfigs(next, current, { preferDestParameters: true })
    } else {
      result = next
    }

    await this.writeConfigAndBaseline(result, next)
  }

  public async analyze(options: { file?: string; tool?: string }): Promise<ProcessedSarifResult[] | null> {
    await this.preflightCodacyCli(true)

    if (!this.isInitialized()) {
      throw new Error('Codacy is not initialized. Please install the Codacy CLI first.')
    }

    const { file, tool } = options

    Logger.debug(`Running Codacy analysis for ${file || 'entire workspace'}...`)

    this.applyProxyEnv()

    try {
      const result = await runnerAnalyze({
        repositoryRoot: this.rootPath,
        files: file ? [this.toRepoRelativePath(file)] : undefined,
        tools: tool ? [tool] : undefined,
        outputFormat: 'sarif',
        logger: this.createRunnerLogger(),
      })

      const sarifResult = JSON.parse(formatOutput(result, 'sarif'))

      const results: ProcessedSarifResult[] =
        sarifResult && 'runs' in sarifResult ? processSarifResults(sarifResult.runs) : []

      Logger.debug(`Codacy analysis completed for ${file || 'entire workspace'} with ${results.length} results.`)

      return results
    } catch (error: unknown) {
      if (error instanceof CodacyError) {
        throw error
      } else {
        throw new CodacyError('Failed to run Codacy analysis', error as Error, 'CLI')
      }
    }
  }

  public async configDiscover(filePath: string): Promise<void> {
    await this.preflightCodacyCli(true)

    if (!this.isInitialized()) {
      throw new Error('Codacy is not initialized. Please install the Codacy CLI first.')
    }

    if (await this.shouldSkipReconfig()) {
      Logger.debug('Config is remote and no identification parameters provided. Skipping config discover.')
      return
    }

    Logger.debug(`Updating Codacy config after change to ${filePath}`)

    try {
      // The runner has no per-file discovery, so re-run the full discovery and merge
      // it into the existing config: newly introduced languages/frameworks pick up
      // the right tooling while the user's local edits are preserved.
      await this.updateConfig()
      Logger.debug(`Codacy config updated for ${filePath}`)
    } catch (error: unknown) {
      if (error instanceof CodacyError) {
        throw error
      } else {
        throw new CodacyError('Failed to run Codacy config discover', error as Error, 'CLI')
      }
    }
  }

  // --- path safety -----------------------------------------------------------

  /**
   * Validates a file path for security concerns and returns it relative to the
   * repository root (the shape the runner expects for `files`).
   *
   * Rejects null bytes, control characters, and path-traversal attempts that would
   * resolve outside the workspace.
   */
  private toRepoRelativePath(filePath: string): string {
    if (!this.isPathSafe(filePath)) {
      throw new Error(`Unsafe file path rejected: ${filePath}`)
    }

    const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(this.rootPath, filePath)
    return path.relative(this.rootPath, resolved)
  }

  private isPathSafe(filePath: string): boolean {
    // Reject null bytes (always a security risk)
    if (filePath.includes('\0')) {
      Logger.warn(`Path contains null byte: ${filePath}`)
      return false
    }

    // Reject all control characters (including newline, tab, carriage return)
    // eslint-disable-next-line no-control-regex -- Intentionally checking for control chars to reject them for security
    const hasUnsafeControlChars = /[\x00-\x1F\x7F]/.test(filePath)
    if (hasUnsafeControlChars) {
      Logger.warn(`Path contains unsafe control characters: ${filePath}`)
      return false
    }

    // Resolve the path to check for path traversal attempts. Comparing the relative
    // path (instead of a string prefix) avoids matching sibling directories that merely
    // share a prefix with the root, e.g. /workspace/project vs /workspace/project-other.
    const resolvedPath = path.resolve(this.rootPath, filePath)
    const relativeToRoot = path.relative(this.rootPath, resolvedPath)
    const escapesRoot = relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)
    if (escapesRoot) {
      Logger.warn(`Path traversal attempt detected: ${filePath} resolves outside workspace`)
      return false
    }

    return true
  }
}
