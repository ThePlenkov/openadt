import { getInactiveObjects as getInactiveObjectsContract } from '@openadt/adt-lsp-contracts'
import { callLspContract } from '../lsp/client/call-lsp-contract'
import type { LspTransport } from './types'

export async function getInactiveObjects(
  transport: LspTransport,
  args: { destination: string; package?: string; objectType?: string }
) {
  return callLspContract(getInactiveObjectsContract, transport, args)
}
