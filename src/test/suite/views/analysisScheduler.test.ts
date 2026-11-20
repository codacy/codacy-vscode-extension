import * as assert from 'assert'
import * as sinon from 'sinon'
import { AnalysisScheduler, SchedulableDocument } from '../../../views/AnalysisScheduler'

const doc = (fsPath: string, version = 1): SchedulableDocument => ({ uri: { fsPath }, version })

suite('AnalysisScheduler', () => {
  let clock: sinon.SinonFakeTimers
  let events: string[]
  let running: number
  let maxRunning: number
  /** Resolves the run in progress, if a test holds runs open. */
  let finishRun: ((completed: boolean) => void) | undefined
  let holdRuns: boolean
  let signals: AbortSignal[]

  const createScheduler = () =>
    new AnalysisScheduler<SchedulableDocument>(async (document, signal) => {
      events.push(`${document.uri.fsPath}@${document.version}`)
      signals.push(signal)
      running++
      maxRunning = Math.max(maxRunning, running)
      try {
        if (holdRuns) return await new Promise<boolean>((resolve) => (finishRun = resolve))
        await new Promise((resolve) => setTimeout(resolve, 100))
        return !signal.aborted
      } finally {
        running--
      }
    })

  setup(() => {
    clock = sinon.useFakeTimers()
    events = []
    running = 0
    maxRunning = 0
    finishRun = undefined
    holdRuns = false
    signals = []
  })

  teardown(() => {
    clock.restore()
  })

  test('runs one analysis at a time, at most once per file', async () => {
    const scheduler = createScheduler()
    const files = Array.from({ length: 10 }, (_, i) => doc(`/repo/file${i}.ts`))

    files.forEach((file) => scheduler.request(file, { delayMs: 0 }))
    files.forEach((file) => scheduler.request(file, { delayMs: 0 }))
    await clock.runAllAsync()

    assert.strictEqual(maxRunning, 1)
    assert.deepStrictEqual(
      events,
      files.map((file) => `${file.uri.fsPath}@1`)
    )
    scheduler.dispose()
  })

  test('debounces requests per file without dropping other files', async () => {
    const scheduler = createScheduler()

    scheduler.request(doc('/repo/a.ts', 1), { delayMs: 2000 })
    scheduler.request(doc('/repo/b.ts', 1), { delayMs: 500 })
    await clock.tickAsync(1000)
    scheduler.request(doc('/repo/a.ts', 2), { delayMs: 2000 })
    await clock.runAllAsync()

    assert.deepStrictEqual(events, ['/repo/b.ts@1', '/repo/a.ts@2'])
    scheduler.dispose()
  })

  test('a request for another file during a run runs after it', async () => {
    holdRuns = true
    const scheduler = createScheduler()

    scheduler.request(doc('/repo/a.ts'), { delayMs: 0 })
    await clock.tickAsync(0)
    scheduler.request(doc('/repo/b.ts'), { delayMs: 0 })
    await clock.tickAsync(0)
    assert.deepStrictEqual(events, ['/repo/a.ts@1'])

    finishRun?.(true)
    await clock.tickAsync(0)
    assert.deepStrictEqual(events, ['/repo/a.ts@1', '/repo/b.ts@1'])
    finishRun?.(true)
    scheduler.dispose()
  })

  test('a newer version of the file being analyzed cancels the run and runs once after it', async () => {
    holdRuns = true
    const scheduler = createScheduler()

    scheduler.request(doc('/repo/a.ts', 1), { delayMs: 0 })
    await clock.tickAsync(0)
    scheduler.request(doc('/repo/a.ts', 2), { delayMs: 500 })
    scheduler.request(doc('/repo/a.ts', 3), { delayMs: 500 })
    assert.strictEqual(signals[0].aborted, true)

    finishRun?.(false)
    await clock.tickAsync(500)
    finishRun?.(true)
    await clock.runAllAsync()

    assert.deepStrictEqual(events, ['/repo/a.ts@1', '/repo/a.ts@3'])
    scheduler.dispose()
  })

  test('a request for the version being analyzed does not cancel it or run again', async () => {
    holdRuns = true
    const scheduler = createScheduler()

    scheduler.request(doc('/repo/a.ts', 1), { delayMs: 0 })
    await clock.tickAsync(0)
    scheduler.request(doc('/repo/a.ts', 1), { delayMs: 0 })
    assert.strictEqual(signals[0].aborted, false)

    finishRun?.(true)
    await clock.runAllAsync()

    assert.deepStrictEqual(events, ['/repo/a.ts@1'])
    scheduler.dispose()
  })

  test('skips versions already analyzed unless forced or reset', async () => {
    const scheduler = createScheduler()
    const file = doc('/repo/a.ts', 4)

    scheduler.request(file, { delayMs: 0 })
    await clock.runAllAsync()
    scheduler.request(file, { delayMs: 0 })
    await clock.runAllAsync()
    assert.strictEqual(events.length, 1)

    scheduler.request(file, { delayMs: 0, force: true })
    await clock.runAllAsync()
    assert.strictEqual(events.length, 2)

    scheduler.resetAnalyzedVersions()
    scheduler.request(file, { delayMs: 0 })
    await clock.runAllAsync()
    assert.strictEqual(events.length, 3)
    scheduler.dispose()
  })

  test('a run that did not complete is not counted as analyzed', async () => {
    holdRuns = true
    const scheduler = createScheduler()
    const file = doc('/repo/a.ts')

    scheduler.request(file, { delayMs: 0 })
    await clock.tickAsync(0)
    finishRun?.(false)
    await clock.tickAsync(0)
    scheduler.request(file, { delayMs: 0 })
    await clock.tickAsync(0)

    assert.strictEqual(events.length, 2)
    finishRun?.(true)
    scheduler.dispose()
  })

  test('forgetting a closed file lets its restarted versions be analyzed', async () => {
    const scheduler = createScheduler()

    scheduler.request(doc('/repo/a.ts', 1), { delayMs: 0 })
    await clock.runAllAsync()
    scheduler.forget('/repo/a.ts')
    scheduler.request(doc('/repo/a.ts', 1), { delayMs: 0 })
    await clock.runAllAsync()

    assert.strictEqual(events.length, 2)
    scheduler.dispose()
  })

  test('dispose drops pending requests and cancels the run in progress', async () => {
    holdRuns = true
    const scheduler = createScheduler()

    scheduler.request(doc('/repo/a.ts'), { delayMs: 0 })
    await clock.tickAsync(0)
    scheduler.request(doc('/repo/b.ts'), { delayMs: 0 })
    scheduler.dispose()
    finishRun?.(true)
    await clock.runAllAsync()

    assert.strictEqual(signals[0].aborted, true)
    assert.deepStrictEqual(events, ['/repo/a.ts@1'])
  })
})
