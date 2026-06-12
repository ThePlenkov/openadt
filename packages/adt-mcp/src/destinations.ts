/**
 * Destination auto-derivation.
 *
 * Per the `--workspace`-only design, OpenADT does not ask which destinations to
 * import: it reads the canonical ADT language-server store
 * (`~/.adtls/destinations.json`, the same one VS Code ADT writes) and registers
 * every destination found there. `destinationsStorePath` for the LSP handshake
 * is the `~/.adtls` *directory*, not the JSON file.
 */
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export type AdtlsDestinationRecord = {
  id: string
  protocol?: string
  properties?: Record<string, string>
}

export type AdtlsDestinationsStore = {
  formatVersion?: string
  destinations?: AdtlsDestinationRecord[]
}

/** ADT LS store directory (`~/.adtls`, override via `ADTLS_HOME`). */
export function adtlsHomeDir(): string {
  return process.env.ADTLS_HOME ?? join(homedir(), '.adtls')
}

/** Canonical ADT language-server destination store file. */
export function adtlsDestinationsStorePath(): string {
  return join(adtlsHomeDir(), 'destinations.json')
}

export function loadAdtlsDestinationsStore(): AdtlsDestinationsStore | undefined {
  const path = adtlsDestinationsStorePath()
  if (!existsSync(path)) {
    return undefined
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as AdtlsDestinationsStore
  } catch {
    return undefined
  }
}

/** Destination ids from the ADT LS store, sorted and de-duplicated. */
export function deriveDestinationIds(
  store: AdtlsDestinationsStore | undefined = loadAdtlsDestinationsStore()
): string[] {
  const ids = new Set<string>()
  for (const entry of store?.destinations ?? []) {
    const id = entry.id?.trim()
    if (id) {
      ids.add(id)
    }
  }
  return [...ids].sort((a, b) => a.localeCompare(b))
}

export type DerivedDestinations = {
  /** `~/.adtls` directory for the LSP `destinationsStorePath` param. */
  storePath: string
  ids: string[]
}

/** Resolve the destinations to register at startup (own mode). */
export function deriveDestinations(): DerivedDestinations {
  return { storePath: adtlsHomeDir(), ids: deriveDestinationIds() }
}
