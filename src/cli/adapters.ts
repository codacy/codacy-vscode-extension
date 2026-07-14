/**
 * Tool adapter registration for the in-process Codacy analysis runner.
 *
 * `@codacy/analysis-runner`'s `analyze()` / `init*()` operate on a tool adapter
 * registry that the runner itself does NOT populate — the `@codacy/analysis-cli`
 * package does, via an internal (non-exported) `registerBuiltinAdapters()`. Since
 * we drive the runner directly instead of shelling out to the CLI, we have to
 * reproduce that registration here.
 *
 * Each `@codacy/tools-*` package ships a lightweight `descriptor` (imported eagerly
 * from its `metadata` export — cheap, no patterns.json / runtime code) plus a full
 * adapter module that is loaded lazily on first use via dynamic import. The `metadata`
 * subpath is the one declared in each package's `exports` map, so it resolves under
 * Node's runtime `require` (see tools-metadata.d.ts for the matching type shim).
 *
 * IMPORTANT: this list mirrors `registerBuiltinAdapters` in
 * `node_modules/@codacy/analysis-cli/dist/index.js` for the pinned
 * `@codacy/analysis-cli` version. Bumping that dependency may require updating the
 * list below (added/removed tools). String literals are used for every import so
 * webpack can externalize each package precisely (see webpack.config.js).
 */
import { registerLazyAdapter, registerUnsupportedTool } from '@codacy/analysis-runner'
import { unsupportedDescriptors } from '@codacy/tools-unsupported-tools'

import { descriptor as dummy1 } from '@codacy/tools-dummy-1/metadata'
import { descriptor as jackson } from '@codacy/tools-jackson/metadata'
import { descriptor as markdownlint0 } from '@codacy/tools-markdownlint-0/metadata'
import { descriptor as shellcheck0 } from '@codacy/tools-shellcheck-0/metadata'
import { descriptor as hadolint2 } from '@codacy/tools-hadolint-2/metadata'
import { descriptor as ruff0 } from '@codacy/tools-ruff-0/metadata'
import { descriptor as cppcheck2 } from '@codacy/tools-cppcheck-2/metadata'
import { descriptor as trivy0 } from '@codacy/tools-trivy-0/metadata'
import { descriptor as opengrep1 } from '@codacy/tools-opengrep-1/metadata'
import { descriptor as stylelint0 } from '@codacy/tools-stylelint-0/metadata'
import { descriptor as spectral1 } from '@codacy/tools-spectral-1/metadata'
import { descriptor as eslint8 } from '@codacy/tools-eslint-8/metadata'
import { descriptor as eslint9 } from '@codacy/tools-eslint-9/metadata'
import { descriptor as flawfinder2 } from '@codacy/tools-flawfinder-2/metadata'
import { descriptor as bandit1 } from '@codacy/tools-bandit-1/metadata'
import { descriptor as pylint3 } from '@codacy/tools-pylint-3/metadata'
import { descriptor as checkov3 } from '@codacy/tools-checkov-3/metadata'
import { descriptor as lizard1 } from '@codacy/tools-lizard-1/metadata'
import { descriptor as checkstyle10 } from '@codacy/tools-checkstyle-10/metadata'
import { descriptor as pmd7 } from '@codacy/tools-pmd-7/metadata'
import { descriptor as pmd6 } from '@codacy/tools-pmd-6/metadata'
import { descriptor as detekt1 } from '@codacy/tools-detekt-1/metadata'
import { descriptor as reek6 } from '@codacy/tools-reek-6/metadata'
import { descriptor as brakeman4 } from '@codacy/tools-brakeman-4/metadata'
import { descriptor as rubocop1 } from '@codacy/tools-rubocop-1/metadata'
import { descriptor as biome2 } from '@codacy/tools-biome-2/metadata'
import { descriptor as revive1 } from '@codacy/tools-revive-1/metadata'
import { descriptor as swiftlint0 } from '@codacy/tools-swiftlint-0/metadata'
import { descriptor as sqlint0 } from '@codacy/tools-sqlint-0/metadata'
import { descriptor as sqlfluff3 } from '@codacy/tools-sqlfluff-3/metadata'
import { descriptor as scalastyle1 } from '@codacy/tools-scalastyle-1/metadata'
import { descriptor as agentlinter0 } from '@codacy/tools-agentlinter-0/metadata'
import { descriptor as prospector1 } from '@codacy/tools-prospector-1/metadata'

// A tools package's default export may be double-wrapped (`default.default`)
// depending on how it was transpiled; unwrap defensively — same as the CLI's `load`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toAdapter = (mod: any) => mod.default?.default ?? mod.default

let registered = false

/**
 * Registers all built-in tool adapters with the runner's registry.
 * Safe to call multiple times — registration only runs once per process.
 */
export function registerBuiltinAdapters(): void {
  if (registered) return
  registered = true

  registerLazyAdapter(dummy1, () => import('@codacy/tools-dummy-1').then(toAdapter))
  registerLazyAdapter(jackson, () => import('@codacy/tools-jackson').then(toAdapter))
  registerLazyAdapter(markdownlint0, () => import('@codacy/tools-markdownlint-0').then(toAdapter))
  registerLazyAdapter(shellcheck0, () => import('@codacy/tools-shellcheck-0').then(toAdapter))
  registerLazyAdapter(hadolint2, () => import('@codacy/tools-hadolint-2').then(toAdapter))
  registerLazyAdapter(ruff0, () => import('@codacy/tools-ruff-0').then(toAdapter))
  registerLazyAdapter(cppcheck2, () => import('@codacy/tools-cppcheck-2').then(toAdapter))
  registerLazyAdapter(trivy0, () => import('@codacy/tools-trivy-0').then(toAdapter))
  registerLazyAdapter(opengrep1, () => import('@codacy/tools-opengrep-1').then(toAdapter))
  registerLazyAdapter(stylelint0, () => import('@codacy/tools-stylelint-0').then(toAdapter))
  registerLazyAdapter(spectral1, () => import('@codacy/tools-spectral-1').then(toAdapter))
  registerLazyAdapter(eslint8, () => import('@codacy/tools-eslint-8').then(toAdapter))
  registerLazyAdapter(eslint9, () => import('@codacy/tools-eslint-9').then(toAdapter))
  registerLazyAdapter(flawfinder2, () => import('@codacy/tools-flawfinder-2').then(toAdapter))
  registerLazyAdapter(bandit1, () => import('@codacy/tools-bandit-1').then(toAdapter))
  registerLazyAdapter(pylint3, () => import('@codacy/tools-pylint-3').then(toAdapter))
  registerLazyAdapter(checkov3, () => import('@codacy/tools-checkov-3').then(toAdapter))
  registerLazyAdapter(lizard1, () => import('@codacy/tools-lizard-1').then(toAdapter))
  registerLazyAdapter(checkstyle10, () => import('@codacy/tools-checkstyle-10').then(toAdapter))
  registerLazyAdapter(pmd7, () => import('@codacy/tools-pmd-7').then(toAdapter))
  registerLazyAdapter(pmd6, () => import('@codacy/tools-pmd-6').then(toAdapter))
  registerLazyAdapter(detekt1, () => import('@codacy/tools-detekt-1').then(toAdapter))
  registerLazyAdapter(reek6, () => import('@codacy/tools-reek-6').then(toAdapter))
  registerLazyAdapter(brakeman4, () => import('@codacy/tools-brakeman-4').then(toAdapter))
  registerLazyAdapter(rubocop1, () => import('@codacy/tools-rubocop-1').then(toAdapter))
  registerLazyAdapter(biome2, () => import('@codacy/tools-biome-2').then(toAdapter))
  registerLazyAdapter(revive1, () => import('@codacy/tools-revive-1').then(toAdapter))
  registerLazyAdapter(swiftlint0, () => import('@codacy/tools-swiftlint-0').then(toAdapter))
  registerLazyAdapter(sqlint0, () => import('@codacy/tools-sqlint-0').then(toAdapter))
  registerLazyAdapter(sqlfluff3, () => import('@codacy/tools-sqlfluff-3').then(toAdapter))
  registerLazyAdapter(scalastyle1, () => import('@codacy/tools-scalastyle-1').then(toAdapter))
  registerLazyAdapter(agentlinter0, () => import('@codacy/tools-agentlinter-0').then(toAdapter))
  registerLazyAdapter(prospector1, () => import('@codacy/tools-prospector-1').then(toAdapter))

  for (const descriptor of unsupportedDescriptors) {
    registerUnsupportedTool(descriptor)
  }
}
