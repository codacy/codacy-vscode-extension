import * as vscode from 'vscode'
import Telemetry from './telemetry'

class Log {
  private _outputChannel: vscode.LogOutputChannel
  private _activePerfMarkers: Map<string, number> = new Map()

  constructor() {
    this._outputChannel = vscode.window.createOutputChannel('Codacy', { log: true })
  }

  public startPerfMarker(marker: string) {
    const startTime = performance.now()
    this._outputChannel.appendLine(`PERF_MARKER> Start ${marker}`)
    this._activePerfMarkers.set(marker, startTime)
  }

  public endPerfMarker(marker: string) {
    const endTime = performance.now()
    this._outputChannel.appendLine(
      `PERF_MARKER> End ${marker}: ${endTime - (this._activePerfMarkers.get(marker) || 0)} ms`
    )
    this._activePerfMarkers.delete(marker)
  }

  private logString(message: string, component?: string) {
    return component ? `${component} > ${message}` : message
  }

  public trace(message: string, component?: string) {
    this._outputChannel.trace(this.logString(message, component))
  }

  public debug(message: string, component?: string) {
    this._outputChannel.debug(this.logString(message, component))
  }

  public appendLine(message: string, component?: string) {
    this._outputChannel.info(this.logString(message, component))
  }

  public warn(message: string, component?: string) {
    this._outputChannel.warn(this.logString(message, component))
  }

  public error(message: string, component?: string) {
    this._outputChannel.error(this.logString(message, component))
    Telemetry.track(`Unexpected Error`, { message, component })
  }

  public dispose() {
    this._outputChannel.dispose()
  }

  public get outputChannel() {
    return this._outputChannel
  }
}

const Logger = new Log()
export default Logger
