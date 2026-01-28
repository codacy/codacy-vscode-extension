/* eslint-disable @typescript-eslint/no-explicit-any */
import * as assert from 'assert'
import { MacCodacyCli } from '../../../cli/MacCodacyCli'
import { LinuxCodacyCli } from '../../../cli/LinuxCodacyCli'
import { WinWSLCodacyCli } from '../../../cli/WinWSLCodacyCli'

suite('CLI Path Escaping Tests', () => {
  const mockRootPath = '/mock/root/path'
  const mockProvider = 'gh'
  const mockOrg = 'test-org'
  const mockRepo = 'test-repo'

  suite('MacCodacyCli', () => {
    let macCli: MacCodacyCli

    setup(() => {
      macCli = new MacCodacyCli(mockRootPath, mockProvider, mockOrg, mockRepo)
    })

    test('should handle paths with spaces', () => {
      const pathWithSpaces = 'path/with spaces/file.js'
      const escaped = (macCli as any).preparePathForExec(pathWithSpaces)
      assert.strictEqual(escaped, 'path/with\\ spaces/file.js')
    })

    test('should handle paths with single quotes', () => {
      const pathWithSingleQuote = "path/with'quote/file.js"
      const escaped = (macCli as any).preparePathForExec(pathWithSingleQuote)
      assert.strictEqual(escaped, "path/with\\'quote/file.js")
    })

    test('should handle paths with double quotes', () => {
      const pathWithDoubleQuote = 'path/with"quote/file.js'
      const escaped = (macCli as any).preparePathForExec(pathWithDoubleQuote)
      assert.strictEqual(escaped, 'path/with\\"quote/file.js')
    })

    test('should handle paths with semicolons', () => {
      const pathWithSemicolon = 'path/with;semicolon/file.js'
      const escaped = (macCli as any).preparePathForExec(pathWithSemicolon)
      assert.strictEqual(escaped, 'path/with\\;semicolon/file.js')
    })

    test('should handle paths with ampersands', () => {
      const pathWithAmpersand = 'path/with&ampersand/file.js'
      const escaped = (macCli as any).preparePathForExec(pathWithAmpersand)
      assert.strictEqual(escaped, 'path/with\\&ampersand/file.js')
    })

    test('should handle paths with pipes', () => {
      const pathWithPipe = 'path/with|pipe/file.js'
      const escaped = (macCli as any).preparePathForExec(pathWithPipe)
      assert.strictEqual(escaped, 'path/with\\|pipe/file.js')
    })

    test('should handle paths with dollar signs', () => {
      const pathWithDollar = 'path/with$dollar/file.js'
      const escaped = (macCli as any).preparePathForExec(pathWithDollar)
      assert.strictEqual(escaped, 'path/with\\$dollar/file.js')
    })

    test('should handle paths with backticks', () => {
      const pathWithBacktick = 'path/with`backtick/file.js'
      const escaped = (macCli as any).preparePathForExec(pathWithBacktick)
      assert.strictEqual(escaped, 'path/with\\`backtick/file.js')
    })

    test('should handle paths with parentheses', () => {
      const pathWithParentheses = 'path/with(parentheses)/file.js'
      const escaped = (macCli as any).preparePathForExec(pathWithParentheses)
      assert.strictEqual(escaped, 'path/with\\(parentheses\\)/file.js')
    })

    test('should handle paths with brackets', () => {
      const pathWithBrackets = 'path/with[brackets]/file.js'
      const escaped = (macCli as any).preparePathForExec(pathWithBrackets)
      assert.strictEqual(escaped, 'path/with\\[brackets\\]/file.js')
    })

    test('should handle paths with braces', () => {
      const pathWithBraces = 'path/with{braces}/file.js'
      const escaped = (macCli as any).preparePathForExec(pathWithBraces)
      assert.strictEqual(escaped, 'path/with\\{braces\\}/file.js')
    })

    test('should handle paths with asterisks', () => {
      const pathWithAsterisk = 'path/with*asterisk/file.js'
      const escaped = (macCli as any).preparePathForExec(pathWithAsterisk)
      assert.strictEqual(escaped, 'path/with\\*asterisk/file.js')
    })

    test('should handle paths with question marks', () => {
      const pathWithQuestionMark = 'path/with?questionmark/file.js'
      const escaped = (macCli as any).preparePathForExec(pathWithQuestionMark)
      assert.strictEqual(escaped, 'path/with\\?questionmark/file.js')
    })

    test('should handle paths with tildes', () => {
      const pathWithTilde = 'path/with~tilde/file.js'
      const escaped = (macCli as any).preparePathForExec(pathWithTilde)
      assert.strictEqual(escaped, 'path/with\\~tilde/file.js')
    })

    test('should handle paths with backslashes', () => {
      const pathWithBackslash = 'path/with\\backslash/file.js'
      const escaped = (macCli as any).preparePathForExec(pathWithBackslash)
      assert.strictEqual(escaped, 'path/with\\\\backslash/file.js')
    })

    test('should handle paths with multiple special characters', () => {
      const complexPath =
        'path with spaces/and\'quotes"and;special&chars|more$complex`stuff(test)[array]{object}*.js?query~home'
      const escaped = (macCli as any).preparePathForExec(complexPath)
      const expected =
        'path\\ with\\ spaces/and\\\'quotes\\"and\\;special\\&chars\\|more\\$complex\\`stuff\\(test\\)\\[array\\]\\{object\\}\\*.js\\?query\\~home'
      assert.strictEqual(escaped, expected)
    })

    test('should handle empty paths (resolves to root)', () => {
      const emptyPath = ''
      const escaped = (macCli as any).preparePathForExec(emptyPath)
      assert.strictEqual(escaped, '')
    })

    test('should handle normal paths without special characters', () => {
      const normalPath = 'normal/path/to/file.js'
      const escaped = (macCli as any).preparePathForExec(normalPath)
      assert.strictEqual(escaped, 'normal/path/to/file.js')
    })
  })

  suite('LinuxCodacyCli', () => {
    let linuxCli: LinuxCodacyCli

    setup(() => {
      linuxCli = new LinuxCodacyCli(mockRootPath, mockProvider, mockOrg, mockRepo)
    })

    test('should inherit the same escaping behavior as MacCodacyCli', () => {
      const pathWithSpaces = 'path/with spaces/file.js'
      const escaped = (linuxCli as any).preparePathForExec(pathWithSpaces)
      assert.strictEqual(escaped, 'path/with\\ spaces/file.js')
    })

    test('should handle complex paths like MacCodacyCli', () => {
      const complexPath =
        'path with spaces/and\'quotes"and;special&chars|more$complex`stuff(test)[array]{object}*.js?query~home'
      const escaped = (linuxCli as any).preparePathForExec(complexPath)
      const expected =
        'path\\ with\\ spaces/and\\\'quotes\\"and\\;special\\&chars\\|more\\$complex\\`stuff\\(test\\)\\[array\\]\\{object\\}\\*.js\\?query\\~home'
      assert.strictEqual(escaped, expected)
    })
  })

  suite('WinWSLCodacyCli', () => {
    let winWSLCli: WinWSLCodacyCli

    setup(() => {
      winWSLCli = new WinWSLCodacyCli(mockRootPath, mockProvider, mockOrg, mockRepo)
    })

    test('should convert Windows paths to WSL format and escape spaces', () => {
      const windowsPath = 'path\\with spaces\\file.js'
      const escaped = (winWSLCli as any).preparePathForExec(windowsPath)
      assert.strictEqual(escaped, 'path/with\\ spaces/file.js')
    })

    test('should handle Windows paths with single quotes', () => {
      const windowsPath = "path\\with'quote\\file.js"
      const escaped = (winWSLCli as any).preparePathForExec(windowsPath)
      assert.strictEqual(escaped, "path/with\\'quote/file.js")
    })

    test('should handle Windows paths with double quotes', () => {
      const windowsPath = 'path\\with"quote\\file.js'
      const escaped = (winWSLCli as any).preparePathForExec(windowsPath)
      assert.strictEqual(escaped, 'path/with\\"quote/file.js')
    })

    test('should handle paths that are already in WSL format', () => {
      const wslPath = 'path/with spaces/file.js'
      const escaped = (winWSLCli as any).preparePathForExec(wslPath)
      assert.strictEqual(escaped, 'path/with\\ spaces/file.js')
    })

    test('should handle complex Windows paths with multiple special characters', () => {
      const complexPath =
        'path with spaces\\and\'quotes"and;special&chars|more$complex`stuff(test)[array]{object}*.js?query~home'
      const escaped = (winWSLCli as any).preparePathForExec(complexPath)
      const expected =
        'path\\ with\\ spaces/and\\\'quotes\\"and\\;special\\&chars\\|more\\$complex\\`stuff\\(test\\)\\[array\\]\\{object\\}\\*.js\\?query\\~home'
      assert.strictEqual(escaped, expected)
    })

    test('should handle paths with already quoted outer quotes', () => {
      const quotedPath = '"path\\with spaces\\file.js"'
      const escaped = (winWSLCli as any).preparePathForExec(quotedPath)
      assert.strictEqual(escaped, 'path/with\\ spaces/file.js')
    })

    test('should handle paths with single quotes around them', () => {
      const quotedPath = "'path\\with spaces\\file.js'"
      const escaped = (winWSLCli as any).preparePathForExec(quotedPath)
      assert.strictEqual(escaped, 'path/with\\ spaces/file.js')
    })

    test('should handle empty paths (resolves to root)', () => {
      const emptyPath = ''
      const escaped = (winWSLCli as any).preparePathForExec(emptyPath)
      assert.strictEqual(escaped, '')
    })

    test('should handle normal Windows paths without special characters', () => {
      const normalPath = 'normal\\path\\to\\file.js'
      const escaped = (winWSLCli as any).preparePathForExec(normalPath)
      assert.strictEqual(escaped, 'normal/path/to/file.js')
    })
  })

  suite('Real-world scenarios', () => {
    let macCli: MacCodacyCli
    let winWSLCli: WinWSLCodacyCli

    setup(() => {
      macCli = new MacCodacyCli(mockRootPath, mockProvider, mockOrg, mockRepo)
      winWSLCli = new WinWSLCodacyCli(mockRootPath, mockProvider, mockOrg, mockRepo)
    })

    test('should handle paths from VS Code workspace that contain spaces and special characters', () => {
      // Common relative paths within a workspace that might contain special characters
      const vscodeWorkspacePaths = [
        'My Projects/project-name/src/file.ts',
        'Documents/Project (2024)/src/file.ts',
        "Desktop/Project's Files/src/file.ts",
        'Documents/My Code & Projects/src/file.ts',
        'My Documents\\Project (v2)\\src\\file.ts',
        'Program Files\\My App\\config.json',
      ]

      // Test Mac/Linux escaping
      const macEscapedPath1 = (macCli as any).preparePathForExec(vscodeWorkspacePaths[0])
      assert.strictEqual(macEscapedPath1, 'My\\ Projects/project-name/src/file.ts')

      const macEscapedPath2 = (macCli as any).preparePathForExec(vscodeWorkspacePaths[1])
      assert.strictEqual(macEscapedPath2, 'Documents/Project\\ \\(2024\\)/src/file.ts')

      const macEscapedPath3 = (macCli as any).preparePathForExec(vscodeWorkspacePaths[2])
      assert.strictEqual(macEscapedPath3, "Desktop/Project\\'s\\ Files/src/file.ts")

      const macEscapedPath4 = (macCli as any).preparePathForExec(vscodeWorkspacePaths[3])
      assert.strictEqual(macEscapedPath4, 'Documents/My\\ Code\\ \\&\\ Projects/src/file.ts')

      // Test Windows WSL escaping
      const winEscapedPath1 = (winWSLCli as any).preparePathForExec(vscodeWorkspacePaths[4])
      assert.strictEqual(winEscapedPath1, 'My\\ Documents/Project\\ \\(v2\\)/src/file.ts')

      const winEscapedPath2 = (winWSLCli as any).preparePathForExec(vscodeWorkspacePaths[5])
      assert.strictEqual(winEscapedPath2, 'Program\\ Files/My\\ App/config.json')
    })

    test('should handle paths with newlines and tabs', () => {
      const pathWithNewline = 'path/with\nnewline/file.js'
      const pathWithTab = 'path/with\ttab/file.js'

      const escapedNewline = (macCli as any).preparePathForExec(pathWithNewline)
      const escapedTab = (macCli as any).preparePathForExec(pathWithTab)

      assert.strictEqual(escapedNewline, 'path/with\\nnewline/file.js')
      assert.strictEqual(escapedTab, 'path/with\\ttab/file.js')
    })
  })

  suite('Path Security Validation', () => {
    let macCli: MacCodacyCli

    setup(() => {
      macCli = new MacCodacyCli(mockRootPath, mockProvider, mockOrg, mockRepo)
    })

    test('should reject paths with null bytes', () => {
      const pathWithNullByte = '/path/with\0null/file.js'
      assert.throws(() => {
        ;(macCli as any).preparePathForExec(pathWithNullByte)
      }, /Unsafe file path rejected/)
    })

    test('should reject paths with unsafe control characters', () => {
      const pathWithControlChar = '/path/with\x01control/file.js'
      assert.throws(() => {
        ;(macCli as any).preparePathForExec(pathWithControlChar)
      }, /Unsafe file path rejected/)
    })

    test('should reject path traversal attempts - parent directory', () => {
      const traversalPath = '../../../../etc/passwd'
      assert.throws(() => {
        ;(macCli as any).preparePathForExec(traversalPath)
      }, /Unsafe file path rejected/)
    })

    test('should reject path traversal attempts - absolute path outside workspace', () => {
      const absolutePath = '/etc/passwd'
      assert.throws(() => {
        ;(macCli as any).preparePathForExec(absolutePath)
      }, /Unsafe file path rejected/)
    })

    test('should accept relative paths within workspace', () => {
      const relativePath = 'src/components/Button.tsx'
      const escaped = (macCli as any).preparePathForExec(relativePath)
      assert.strictEqual(escaped, 'src/components/Button.tsx')
    })

    test('should accept paths with safe special characters', () => {
      const safePath = 'my project (2024)/file name [v2].js'
      const escaped = (macCli as any).preparePathForExec(safePath)
      assert.strictEqual(escaped, 'my\\ project\\ \\(2024\\)/file\\ name\\ \\[v2\\].js')
    })

    test('should handle paths with redirect characters', () => {
      const pathWithRedirect = 'file>output.txt'
      const escaped = (macCli as any).preparePathForExec(pathWithRedirect)
      assert.strictEqual(escaped, 'file\\>output.txt')
    })

    test('should handle paths with less-than characters', () => {
      const pathWithLessThan = 'file<input.txt'
      const escaped = (macCli as any).preparePathForExec(pathWithLessThan)
      assert.strictEqual(escaped, 'file\\<input.txt')
    })
  })
})
