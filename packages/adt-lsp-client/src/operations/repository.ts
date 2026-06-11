import { quickSearch as quickSearchContract } from '@openadt/adt-lsp-contracts'
import { callLspContract } from '../lsp/client/call-lsp-contract'
import { resolveRepotreeUri } from '../lsp/client/resolve-repotree-uri'
import type { LspTransport } from './types'

export async function quickSearch(
  transport: LspTransport,
  args: {
    destination: string
    searchTerm: string
    types?: string[]
    maxResults?: number
  }
) {
  return callLspContract(quickSearchContract, transport, {
    destination: args.destination,
    pattern: args.searchTerm,
    types: args.types,
    maxResults: args.maxResults,
  })
}

export async function getLsUri(
  transport: LspTransport,
  args: { destination: string; uri: string }
): Promise<{ uri: string }> {
  const uri = await resolveRepotreeUri(transport, args)
  return { uri }
}
