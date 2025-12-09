import { MacCodacyCli } from './MacCodacyCli'


export class WinWSLCodacyCli extends MacCodacyCli {
  constructor(rootPath: string, provider?: string, organization?: string, repository?: string) {
    const winRootPath =
      rootPath.startsWith('/mnt/') || rootPath.startsWith("'/mnt/") ? WinWSLCodacyCli.fromWSLPath(rootPath) : rootPath
    super(winRootPath, provider, organization, repository)
  }

  private static toWSLPath(path: string): string {
    // Convert Windows path to WSL path
    // Example: 'C:\Users\user\project' -> '/mnt/c/Users/user/project'
    // Remove quotes and unescape any escaped spaces
    let cleanPath = path.replace(/^'|'$/g, '')
    cleanPath = cleanPath.replace(/\\ /g, ' ')
    // Convert backslashes to slashes and add /mnt/ prefix
    // Note: We don't escape spaces here - the parent preparePathForExec will handle all escaping
    const wslPath = cleanPath.replace(/\\/g, '/').replace(/^'?([a-zA-Z]):/, '/mnt/$1')
    return wslPath
  }

  private static fromWSLPath(path: string): string {
    // Convert WSL path to Windows path while keeping quotes
    // Example: '/mnt/c/Users/user/project' -> 'C:\Users\user\project'
    const windowsPath = path.replace(/^'\/mnt\/([a-zA-Z])/, "'$1:").replace(/\//g, '\\')
    return windowsPath
  }

  protected preparePathForExec(path: string): string {
    // Convert the path to WSL format first
    const wslPath = WinWSLCodacyCli.toWSLPath(path)
    // Then apply the base class escaping for shell special characters
    return super.preparePathForExec(wslPath)
  }

  protected async execAsync(
    command: string,
    args?: Record<string, string>
  ): Promise<{ stdout: string; stderr: string }> {
    return await super.execAsync(`wsl ${command}`, args)
  }

  public getCliCommand(): string {
    return WinWSLCodacyCli.toWSLPath(super.getCliCommand())
  }
}
