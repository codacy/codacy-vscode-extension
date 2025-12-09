import * as assert from 'assert'
import { CodacyCli } from '../../../cli/CodacyCli'

// Test implementation of CodacyCli to access protected method
class TestCodacyCli extends CodacyCli {
  constructor() {
    super('/test/root')
  }

  public testPreparePathForExec(path: string): string {
    return this.preparePathForExec(path)
  }

  public async preflightCodacyCli(): Promise<void> {
    // Not needed for testing
  }

  public async install(): Promise<void> {
    // Not needed for testing
  }

  public async installDependencies(): Promise<void> {
    // Not needed for testing
  }

  public async update(): Promise<void> {
    // Not needed for testing
  }

  public async initialize(): Promise<void> {
    // Not needed for testing
  }

  public async analyze(): Promise<any> {
    // Not needed for testing
    return null
  }

  public async configDiscover(): Promise<void> {
    // Not needed for testing
  }
}

suite('CodacyCli - preparePathForExec', () => {
  let cli: TestCodacyCli

  setup(() => {
    cli = new TestCodacyCli()
  })

  test('handles paths with parentheses', () => {
    const input = '/path/to/file(with)parentheses.ts'
    const output = cli.testPreparePathForExec(input)
    // Should wrap in double quotes to handle special characters
    assert.strictEqual(output, '"/path/to/file(with)parentheses.ts"')
  })

  test('handles paths with spaces', () => {
    const input = '/path/to/file with spaces.ts'
    const output = cli.testPreparePathForExec(input)
    // Should wrap in double quotes
    assert.strictEqual(output, '"/path/to/file with spaces.ts"')
  })

  test('handles paths with single quotes', () => {
    const input = "/path/to/file'with'quotes.ts"
    const output = cli.testPreparePathForExec(input)
    // Should wrap in double quotes (single quotes don't need escaping inside double quotes)
    assert.strictEqual(output, '"/path/to/file\'with\'quotes.ts"')
  })

  test('handles paths with double quotes', () => {
    const input = '/path/to/file"with"quotes.ts'
    const output = cli.testPreparePathForExec(input)
    // Should escape double quotes inside double quotes
    assert.strictEqual(output, '"/path/to/file\\"with\\"quotes.ts"')
  })

  test('handles paths with square brackets', () => {
    const input = '/path/to/file[with]brackets.ts'
    const output = cli.testPreparePathForExec(input)
    // Should wrap in double quotes
    assert.strictEqual(output, '"/path/to/file[with]brackets.ts"')
  })

  test('handles paths with curly braces', () => {
    const input = '/path/to/file{with}braces.ts'
    const output = cli.testPreparePathForExec(input)
    // Should wrap in double quotes
    assert.strictEqual(output, '"/path/to/file{with}braces.ts"')
  })

  test('handles paths with asterisks', () => {
    const input = '/path/to/file*with*asterisks.ts'
    const output = cli.testPreparePathForExec(input)
    // Should wrap in double quotes
    assert.strictEqual(output, '"/path/to/file*with*asterisks.ts"')
  })

  test('handles paths with question marks', () => {
    const input = '/path/to/file?with?questions.ts'
    const output = cli.testPreparePathForExec(input)
    // Should wrap in double quotes
    assert.strictEqual(output, '"/path/to/file?with?questions.ts"')
  })

  test('handles paths with ampersands', () => {
    const input = '/path/to/file&with&ampersands.ts'
    const output = cli.testPreparePathForExec(input)
    // Should wrap in double quotes
    assert.strictEqual(output, '"/path/to/file&with&ampersands.ts"')
  })

  test('handles paths with dollar signs', () => {
    const input = '/path/to/file$with$dollars.ts'
    const output = cli.testPreparePathForExec(input)
    // Should escape dollar signs inside double quotes
    assert.strictEqual(output, '"/path/to/file\\$with\\$dollars.ts"')
  })

  test('handles paths with backticks', () => {
    const input = '/path/to/file`with`backticks.ts'
    const output = cli.testPreparePathForExec(input)
    // Should escape backticks inside double quotes
    assert.strictEqual(output, '"/path/to/file\\`with\\`backticks.ts"')
  })

  test('handles paths with exclamation marks', () => {
    const input = '/path/to/file!with!exclamations.ts'
    const output = cli.testPreparePathForExec(input)
    // Should wrap in double quotes
    assert.strictEqual(output, '"/path/to/file!with!exclamations.ts"')
  })

  test('handles paths with hash/pound signs', () => {
    const input = '/path/to/file#with#hashes.ts'
    const output = cli.testPreparePathForExec(input)
    // Should wrap in double quotes
    assert.strictEqual(output, '"/path/to/file#with#hashes.ts"')
  })

  test('handles paths with semicolons', () => {
    const input = '/path/to/file;with;semicolons.ts'
    const output = cli.testPreparePathForExec(input)
    // Should wrap in double quotes
    assert.strictEqual(output, '"/path/to/file;with;semicolons.ts"')
  })

  test('handles paths with pipes', () => {
    const input = '/path/to/file|with|pipes.ts'
    const output = cli.testPreparePathForExec(input)
    // Should wrap in double quotes
    assert.strictEqual(output, '"/path/to/file|with|pipes.ts"')
  })

  test('handles paths with less-than and greater-than signs', () => {
    const input = '/path/to/file<with>angles.ts'
    const output = cli.testPreparePathForExec(input)
    // Should wrap in double quotes
    assert.strictEqual(output, '"/path/to/file<with>angles.ts"')
  })

  test('handles paths with backslashes', () => {
    const input = '/path/to/file\\with\\backslashes.ts'
    const output = cli.testPreparePathForExec(input)
    // Should escape backslashes inside double quotes
    assert.strictEqual(output, '"/path/to/file\\\\with\\\\backslashes.ts"')
  })

  test('handles paths with multiple special characters', () => {
    const input = '/path/to/(file) with [special] chars & $vars.ts'
    const output = cli.testPreparePathForExec(input)
    // Should escape only $, `, \, " inside double quotes
    assert.strictEqual(output, '"/path/to/(file) with [special] chars & \\$vars.ts"')
  })

  test('handles normal paths without special characters', () => {
    const input = '/path/to/normalfile.ts'
    const output = cli.testPreparePathForExec(input)
    // Should wrap in double quotes
    assert.strictEqual(output, '"/path/to/normalfile.ts"')
  })

  test('handles paths with dashes and underscores (safe characters)', () => {
    const input = '/path/to/file-with_safe-chars.ts'
    const output = cli.testPreparePathForExec(input)
    // Should wrap in double quotes
    assert.strictEqual(output, '"/path/to/file-with_safe-chars.ts"')
  })

  test('handles paths with dots (safe characters)', () => {
    const input = '/path/to/file.with.dots.ts'
    const output = cli.testPreparePathForExec(input)
    // Should wrap in double quotes
    assert.strictEqual(output, '"/path/to/file.with.dots.ts"')
  })

  test('handles empty string', () => {
    const input = ''
    const output = cli.testPreparePathForExec(input)
    // Should return empty string with quotes
    assert.strictEqual(output, '""')
  })

  test('handles root path', () => {
    const input = '/'
    const output = cli.testPreparePathForExec(input)
    // Should wrap in double quotes
    assert.strictEqual(output, '"/"')
  })
})
