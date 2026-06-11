import { runApplication as runApplicationContract } from '@openadt/adt-lsp-contracts'
import { callLspContract } from '../lsp/client/call-lsp-contract'
import { prewarmRepotreeObject } from '../lsp/client/prewarm-repotree-object'
import type { DestinationUri, LspTransport } from './types'

export async function runAbapApplication(transport: LspTransport, args: DestinationUri) {
  const { repotreeUri } = await prewarmRepotreeObject(transport, args)
  return callLspContract(runApplicationContract, transport, repotreeUri, {
    paramStructure: 'byPosition',
  })
}
