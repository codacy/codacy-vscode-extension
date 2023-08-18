import { Memento } from 'vscode'

export class InMemoryMemento implements Memento {
  private _storage: { [keyName: string]: unknown } = {}

  get<T>(key: string): T | undefined
  get<T>(key: string, defaultValue: T): T
  get(key: string, defaultValue?: unknown) {
    return this._storage[key] || defaultValue
  }

  update(key: string, value: unknown): Thenable<void> {
    this._storage[key] = value
    return Promise.resolve()
  }

  keys(): readonly string[] {
    return Object.keys(this._storage)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setKeysForSync(keys: string[]): void {}
}
