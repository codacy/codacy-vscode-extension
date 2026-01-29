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

    test('should reject paths with newlines for security', () => {
      const pathWithNewline = 'path/with\nnewline/file.js'
      assert.throws(() => {
        ;(macCli as any).preparePathForExec(pathWithNewline)
      }, /Unsafe file path rejected/)
    })

    test('should reject paths with tabs for security', () => {
      const pathWithTab = 'path/with\ttab/file.js'
      assert.throws(() => {
        ;(macCli as any).preparePathForExec(pathWithTab)
      }, /Unsafe file path rejected/)
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

  suite('WSL Path Conversion - toWSLPath', () => {
    test('should convert Windows C: drive path to WSL format', () => {
      const windowsPath = 'C:\\Users\\user\\project\\file.js'
      const wslPath = (WinWSLCodacyCli as any).toWSLPath(windowsPath)
      assert.strictEqual(wslPath, '/mnt/c/Users/user/project/file.js')
    })

    test('should convert Windows D: drive path to WSL format', () => {
      const windowsPath = 'D:\\data\\files\\document.txt'
      const wslPath = (WinWSLCodacyCli as any).toWSLPath(windowsPath)
      assert.strictEqual(wslPath, '/mnt/d/data/files/document.txt')
    })

    test('should handle uppercase drive letters', () => {
      const windowsPath = 'E:\\Projects\\MyApp\\src\\index.ts'
      const wslPath = (WinWSLCodacyCli as any).toWSLPath(windowsPath)
      assert.strictEqual(wslPath, '/mnt/e/Projects/MyApp/src/index.ts')
    })

    test('should handle lowercase drive letters', () => {
      const windowsPath = 'c:\\users\\test\\file.js'
      const wslPath = (WinWSLCodacyCli as any).toWSLPath(windowsPath)
      assert.strictEqual(wslPath, '/mnt/c/users/test/file.js')
    })

    test('should handle paths with spaces', () => {
      const windowsPath = 'C:\\Program Files\\My App\\config.json'
      const wslPath = (WinWSLCodacyCli as any).toWSLPath(windowsPath)
      assert.strictEqual(wslPath, '/mnt/c/Program Files/My App/config.json')
    })

    test('should handle paths with special characters', () => {
      const windowsPath = "C:\\Users\\user's\\project (2024)\\file.js"
      const wslPath = (WinWSLCodacyCli as any).toWSLPath(windowsPath)
      assert.strictEqual(wslPath, "/mnt/c/Users/user's/project (2024)/file.js")
    })

    test('should remove outer double quotes from path', () => {
      const windowsPath = '"C:\\Users\\user\\project\\file.js"'
      const wslPath = (WinWSLCodacyCli as any).toWSLPath(windowsPath)
      assert.strictEqual(wslPath, '/mnt/c/Users/user/project/file.js')
    })

    test('should remove outer single quotes from path', () => {
      const windowsPath = "'C:\\Users\\user\\project\\file.js'"
      const wslPath = (WinWSLCodacyCli as any).toWSLPath(windowsPath)
      assert.strictEqual(wslPath, '/mnt/c/Users/user/project/file.js')
    })

    test('should handle relative paths without drive letter', () => {
      const windowsPath = 'relative\\path\\to\\file.js'
      const wslPath = (WinWSLCodacyCli as any).toWSLPath(windowsPath)
      assert.strictEqual(wslPath, 'relative/path/to/file.js')
    })

    test('should handle empty path', () => {
      const windowsPath = ''
      const wslPath = (WinWSLCodacyCli as any).toWSLPath(windowsPath)
      assert.strictEqual(wslPath, '')
    })

    test('should handle path with only drive letter', () => {
      const windowsPath = 'C:\\'
      const wslPath = (WinWSLCodacyCli as any).toWSLPath(windowsPath)
      assert.strictEqual(wslPath, '/mnt/c/')
    })

    test('should preserve internal quotes', () => {
      const windowsPath = 'C:\\path\\with"quotes"inside\\file.js'
      const wslPath = (WinWSLCodacyCli as any).toWSLPath(windowsPath)
      assert.strictEqual(wslPath, '/mnt/c/path/with"quotes"inside/file.js')
    })

    test('should handle multiple drive letter variations (Z drive)', () => {
      const windowsPath = 'Z:\\network\\share\\file.txt'
      const wslPath = (WinWSLCodacyCli as any).toWSLPath(windowsPath)
      assert.strictEqual(wslPath, '/mnt/z/network/share/file.txt')
    })
  })

  suite('WSL Path Conversion - fromWSLPath', () => {
    test('should convert WSL /mnt/c path to Windows C: drive', () => {
      const wslPath = '/mnt/c/Users/user/project/file.js'
      const windowsPath = (WinWSLCodacyCli as any).fromWSLPath(wslPath)
      assert.strictEqual(windowsPath, 'C:\\Users\\user\\project\\file.js')
    })

    test('should convert WSL /mnt/d path to Windows D: drive', () => {
      const wslPath = '/mnt/d/data/files/document.txt'
      const windowsPath = (WinWSLCodacyCli as any).fromWSLPath(wslPath)
      assert.strictEqual(windowsPath, 'D:\\data\\files\\document.txt')
    })

    test('should handle uppercase drive mount (should convert to uppercase)', () => {
      const wslPath = '/mnt/E/Projects/MyApp/src/index.ts'
      const windowsPath = (WinWSLCodacyCli as any).fromWSLPath(wslPath)
      assert.strictEqual(windowsPath, 'E:\\Projects\\MyApp\\src\\index.ts')
    })

    test('should handle paths with spaces', () => {
      const wslPath = '/mnt/c/Program Files/My App/config.json'
      const windowsPath = (WinWSLCodacyCli as any).fromWSLPath(wslPath)
      assert.strictEqual(windowsPath, 'C:\\Program Files\\My App\\config.json')
    })

    test('should handle paths with special characters', () => {
      const wslPath = "/mnt/c/Users/user's/project (2024)/file.js"
      const windowsPath = (WinWSLCodacyCli as any).fromWSLPath(wslPath)
      assert.strictEqual(windowsPath, "C:\\Users\\user's\\project (2024)\\file.js")
    })

    test('should handle quoted WSL paths with leading quote', () => {
      const wslPath = "'/mnt/c/Users/user/project/file.js"
      const windowsPath = (WinWSLCodacyCli as any).fromWSLPath(wslPath)
      assert.strictEqual(windowsPath, "'C:\\Users\\user\\project\\file.js")
    })

    test('should handle quoted WSL paths', () => {
      const wslPath = "'/mnt/c/Users/user/project/file.js'"
      const windowsPath = (WinWSLCodacyCli as any).fromWSLPath(wslPath)
      assert.strictEqual(windowsPath, "'C:\\Users\\user\\project\\file.js'")
    })

    test('should handle relative WSL paths without /mnt prefix', () => {
      const wslPath = 'relative/path/to/file.js'
      const windowsPath = (WinWSLCodacyCli as any).fromWSLPath(wslPath)
      assert.strictEqual(windowsPath, 'relative\\path\\to\\file.js')
    })

    test('should handle empty path', () => {
      const wslPath = ''
      const windowsPath = (WinWSLCodacyCli as any).fromWSLPath(wslPath)
      assert.strictEqual(windowsPath, '')
    })

    test('should handle root path /mnt/c/', () => {
      const wslPath = '/mnt/c/'
      const windowsPath = (WinWSLCodacyCli as any).fromWSLPath(wslPath)
      assert.strictEqual(windowsPath, 'C:\\')
    })

    test('should handle paths starting with quote and /mnt', () => {
      const wslPath = "'/mnt/c/path/to/file.js"
      const windowsPath = (WinWSLCodacyCli as any).fromWSLPath(wslPath)
      assert.strictEqual(windowsPath, "'C:\\path\\to\\file.js")
    })

    test('should handle multiple drive letter variations (Z drive)', () => {
      const wslPath = '/mnt/z/network/share/file.txt'
      const windowsPath = (WinWSLCodacyCli as any).fromWSLPath(wslPath)
      assert.strictEqual(windowsPath, 'Z:\\network\\share\\file.txt')
    })

    test('should not modify absolute WSL paths without /mnt', () => {
      const wslPath = '/usr/local/bin/script.sh'
      const windowsPath = (WinWSLCodacyCli as any).fromWSLPath(wslPath)
      assert.strictEqual(windowsPath, '\\usr\\local\\bin\\script.sh')
    })
  })

  suite('WSL Path Conversion - Round Trip', () => {
    test('should handle round trip conversion C: drive', () => {
      const originalWindows = 'C:\\Users\\user\\project\\file.js'
      const wslPath = (WinWSLCodacyCli as any).toWSLPath(originalWindows)
      const backToWindows = (WinWSLCodacyCli as any).fromWSLPath(wslPath)
      assert.strictEqual(backToWindows, originalWindows)
    })

    test('should handle round trip conversion with spaces', () => {
      const originalWindows = 'C:\\Program Files\\My Application\\config.json'
      const wslPath = (WinWSLCodacyCli as any).toWSLPath(originalWindows)
      const backToWindows = (WinWSLCodacyCli as any).fromWSLPath(wslPath)
      assert.strictEqual(backToWindows, originalWindows)
    })

    test('should handle round trip conversion with special characters', () => {
      const originalWindows = "D:\\Projects\\Project's Name (2024)\\src\\index.ts"
      const wslPath = (WinWSLCodacyCli as any).toWSLPath(originalWindows)
      const backToWindows = (WinWSLCodacyCli as any).fromWSLPath(wslPath)
      assert.strictEqual(backToWindows, originalWindows)
    })

    test('should handle round trip conversion for relative paths', () => {
      const originalPath = 'relative\\path\\to\\file.js'
      const wslPath = (WinWSLCodacyCli as any).toWSLPath(originalPath)
      const backToWindows = (WinWSLCodacyCli as any).fromWSLPath(wslPath)
      assert.strictEqual(backToWindows, originalPath)
    })

    test('should handle reverse round trip WSL to Windows to WSL', () => {
      const originalWSL = '/mnt/c/Users/user/Documents/file.txt'
      const windowsPath = (WinWSLCodacyCli as any).fromWSLPath(originalWSL)
      const backToWSL = (WinWSLCodacyCli as any).toWSLPath(windowsPath)
      assert.strictEqual(backToWSL, originalWSL)
    })
  })
})
