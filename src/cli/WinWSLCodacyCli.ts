import { MacCodacyCli } from './MacCodacyCli'
import * as path from 'path'
import Logger from '../common/logger'

export class WinWSLCodacyCli extends MacCodacyCli {
  constructor(rootPath: string, provider?: string, organization?: string, repository?: string) {
    const winRootPath =
      rootPath.startsWith('/mnt/') || rootPath.startsWith("'/mnt/") ? WinWSLCodacyCli.fromWSLPath(rootPath) : rootPath
    super(winRootPath, provider, organization, repository)
  }

  private static toWSLPath(path: string): string {
    // Convert Windows path to WSL path
    // Example: 'C:\Users\user\project' -> '/mnt/c/Users/user/project'
    // First, remove outer quotes if present
    const cleanPath = path.replace(/^["']|["']$/g, '')
    // Convert backslashes to slashes and handle drive letter
    const wslPath = cleanPath
      .replace(/\\/g, '/')
      .replace(/^([a-zA-Z]):/, (match, letter) => `/mnt/${letter.toLowerCase()}`)
    return wslPath
  }

  private static fromWSLPath(path: string): string {
    // Convert WSL path to Windows path while keeping quotes
    // Example: '/mnt/c/Users/user/project' -> 'C:\Users\user\project'
    const windowsPath = path
      .replace(/^'\/mnt\/([a-zA-Z])/, (match, letter) => `'${letter.toUpperCase()}:`)
      .replace(/^\/mnt\/([a-zA-Z])/, (match, letter) => `${letter.toUpperCase()}:`)
      .replace(/\//g, '\\')
    return windowsPath
  }

  /**
   * Override path preparation to handle WSL paths correctly
   * Validates in Windows format, then converts to WSL and escapes
   */
  protected preparePathForExec(filePath: string): string {
    // Convert WSL path to Windows format for validation
    const winFilePath = filePath.startsWith('/mnt/') ? WinWSLCodacyCli.fromWSLPath(filePath) : filePath

    // Validate path security (in Windows format to match this.rootPath)
    // Reject null bytes (always a security risk)
    if (winFilePath.includes('\0')) {
      Logger.warn(`Path contains null byte: ${filePath}`)
      throw new Error(`Unsafe file path rejected: ${filePath}`)
    }

    // Reject all control characters
    // eslint-disable-next-line no-control-regex -- Intentionally checking for control chars to reject them for security
    const hasUnsafeControlChars = /[\x00-\x1F\x7F]/.test(winFilePath)
    if (hasUnsafeControlChars) {
      Logger.warn(`Path contains unsafe control characters: ${filePath}`)
      throw new Error(`Unsafe file path rejected: ${filePath}`)
    }

    // Resolve the path to check for path traversal attempts
    // Both paths should be in Windows format at this point
    const resolvedPath = path.resolve(this.rootPath, winFilePath)
    const normalizedRoot = path.normalize(this.rootPath)

    // Check if the resolved path is within the workspace
    if (!resolvedPath.startsWith(normalizedRoot)) {
      Logger.warn(`Path traversal attempt detected: ${filePath} resolves outside workspace`)
      throw new Error(`Unsafe file path rejected: ${filePath}`)
    }

    // Convert to WSL format and escape special characters
    const wslPath = WinWSLCodacyCli.toWSLPath(winFilePath)
    return wslPath.replace(/([\s'"\\;&|`$()[\]{}*?~<>])/g, '\\$1')
  }

  protected async execAsync(
    command: string,
    args?: Record<string, string>
  ): Promise<{ stdout: string; stderr: string }> {
    return await super.execAsync(`wsl bash -c "${command}"`, args)
  }

  public getCliCommand(): string {
    return WinWSLCodacyCli.toWSLPath(super.getCliCommand())
  }
}
