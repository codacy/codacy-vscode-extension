import * as path from 'path'
import * as Mocha from 'mocha'
import { glob } from 'glob'

export async function run(): Promise<void> {
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
  })

  const testsRoot = path.resolve(__dirname, '..')

  const testFiles = await glob('**/**.test.js', { cwd: testsRoot })
  testFiles.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)))

  try {
    await new Promise<void>((c, e) => {
      mocha.run((failures) => {
        if (failures > 0) {
          e(new Error(`${failures} tests failed.`))
        } else {
          c()
        }
      })
    })
  } catch (err) {
    console.error(err)
  }
}
