import * as vscode from 'vscode'

/** The parts of a `vscode.TextDocument` the scheduler needs. */
export interface SchedulableDocument {
  readonly uri: { readonly fsPath: string }
  readonly version: number
}

export interface AnalysisRequestOptions {
  /** How long to wait for further requests for the same file before queuing it. */
  delayMs: number
  /** Analyze even if this version of the file was already analyzed. */
  force?: boolean
}

/**
 * Runs one file analysis at a time.
 *
 * - Requests are debounced per file, so typing in one file does not cancel a
 *   pending request for another.
 * - While an analysis runs, only the latest request per file is kept; the others
 *   wait their turn instead of being dropped.
 * - A request for a newer version of the file being analyzed cancels that run.
 * - A version that was already analyzed is not analyzed again unless forced.
 */
export class AnalysisScheduler<D extends SchedulableDocument> implements vscode.Disposable {
  private readonly _timers = new Map<string, NodeJS.Timeout>()
  private readonly _pending = new Map<string, { document: D; force: boolean }>()
  private readonly _analyzedVersions = new Map<string, number>()
  private _inFlight: { key: string; version: number; controller: AbortController } | undefined
  private _draining = false
  private _disposed = false

  /**
   * @param _run Analyzes a document. Resolves to `true` when the analysis completed,
   *   so this version counts as analyzed; `false` when it was skipped or cancelled.
   */
  constructor(private readonly _run: (document: D, signal: AbortSignal) => Promise<boolean>) {}

  public request(document: D, options: AnalysisRequestOptions): void {
    if (this._disposed) return
    const key = document.uri.fsPath

    // The file changed while it was being analyzed: those results are already stale.
    if (this._inFlight?.key === key && (options.force || this._inFlight.version !== document.version)) {
      this._inFlight.controller.abort()
    }

    const timer = this._timers.get(key)
    if (timer) clearTimeout(timer)
    const force = options.force ?? false
    this._timers.set(
      key,
      setTimeout(() => {
        this._timers.delete(key)
        const previous = this._pending.get(key)
        // Re-insert so the file goes to the back of the queue with its latest version.
        this._pending.delete(key)
        this._pending.set(key, { document, force: force || (previous?.force ?? false) })
        void this.drain()
      }, options.delayMs)
    )
  }

  /** Forgets a file, e.g. when it is closed: its version numbers restart on reopen. */
  public forget(fsPath: string): void {
    const timer = this._timers.get(fsPath)
    if (timer) clearTimeout(timer)
    this._timers.delete(fsPath)
    this._pending.delete(fsPath)
    this._analyzedVersions.delete(fsPath)
    if (this._inFlight?.key === fsPath) this._inFlight.controller.abort()
  }

  /** Lets every file be analyzed again, e.g. after a tool became available. */
  public resetAnalyzedVersions(): void {
    this._analyzedVersions.clear()
  }

  public dispose(): void {
    this._disposed = true
    this._timers.forEach((timer) => clearTimeout(timer))
    this._timers.clear()
    this._pending.clear()
    this._inFlight?.controller.abort()
  }

  private async drain(): Promise<void> {
    if (this._draining) return
    this._draining = true
    try {
      while (!this._disposed) {
        const next = this._pending.entries().next()
        if (next.done) break
        const [key, { document, force }] = next.value
        this._pending.delete(key)

        if (!force && this._analyzedVersions.get(key) === document.version) continue

        const controller = new AbortController()
        this._inFlight = { key, version: document.version, controller }
        try {
          const completed = await this._run(document, controller.signal)
          if (completed && !controller.signal.aborted) this._analyzedVersions.set(key, document.version)
        } catch {
          // The runner reports its own errors; a failed run just isn't marked analyzed.
        } finally {
          this._inFlight = undefined
        }
      }
    } finally {
      this._draining = false
    }
  }
}
