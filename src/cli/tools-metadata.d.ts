// Type shim for the `@codacy/tools-<name>/metadata` subpath imports used in adapters.ts.
//
// Those packages expose `metadata` via their `exports` map (which resolves at runtime
// and under webpack), but the project's classic `moduleResolution: "node"` does not read
// `exports` maps, so it can't locate the types on its own. This wildcard declaration
// supplies the descriptor's type for every matching metadata module.
declare module '@codacy/tools-*/metadata' {
  import type { AdapterDescriptor } from '@codacy/tooling'
  export const descriptor: AdapterDescriptor
}
