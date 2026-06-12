/**
 * Resolve an ADT object path or repotree URI to the canonical repotree/AFF URI.
 */
import { LSP_METHOD_REPOSITORY_GET_LS_URI } from '@openadt/adt-config'
import type { LspTransport } from './lsp-transport'

/** True when `uri` is already a repotree/AFF URI from getLsUri (not an ADT path). */
export function isRepotreeUri(uri: string): boolean {
  return uri.startsWith('abap:/repotree-v1/') || uri.startsWith('abap:/flat/')
}

export async function resolveRepotreeUri(
  transport: LspTransport,
  options: { destination: string; uri: string }
): Promise<string> {
  if (isRepotreeUri(options.uri)) {
    return options.uri
  }

  const result = (await transport.sendRequest(LSP_METHOD_REPOSITORY_GET_LS_URI, {
    destination: options.destination,
    adtUri: options.uri,
  })) as { uri?: string }

  if (!result?.uri) {
    throw new Error(`getLsUri returned no repotree URI for ${options.uri}`)
  }

  return result.uri
}
