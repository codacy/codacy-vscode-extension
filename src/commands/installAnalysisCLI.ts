import * as os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function isCLIInstalled(): Promise<boolean> {
  try {
    await execAsync('codacy-cli --version')
    return true
  } catch {
    return false
  }
}

export async function installCodacyCLI(): Promise<void> {
  const platform = os.platform()

  if (await isCLIInstalled()) {
    return
  }

  try {
    switch (platform) {
      case 'darwin':
        await execAsync('brew install codacy/codacy-cli-v2/codacy-cli-v2')
        break

      case 'linux':
        await execAsync('bash <(curl -Ls https://raw.githubusercontent.com/codacy/codacy-cli-v2/main/codacy-cli.sh)')
        break

      case 'win32':
        throw new Error('Codacy CLI is not supported on Windows yet.')

      default:
        throw new Error(`Unsupported operating system: ${platform}`)
    }

    // Run codacy-cli install after successful installation
    await execAsync('codacy-cli install')
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to install Codacy CLI: ${error.message}`)
    }
    throw error
  }
}
