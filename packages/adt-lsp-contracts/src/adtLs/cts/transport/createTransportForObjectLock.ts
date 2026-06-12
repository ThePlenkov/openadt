/**
 * Create transport contract.
 * LSP method: adtLs/cts/transport/createTransportForObjectLock
 */
import { lspEndpoint, type, type LspEndpoint } from '../../../lsp/contract-core'

export const createTransportForObjectLock: LspEndpoint = lspEndpoint({
  method: 'adtLs/cts/transport/createTransportForObjectLock',
  types: {
    params: type<{
      description?: string
      ctsProject?: string
      changeGuid?: string
      checkData: {
        operationType: 'CREATION' | 'MODIFICATION'
        objectInfo: { objectUri: string }
        transportLayer?: string
        isRecordChanges?: boolean
      }
    }>(),
    response: type<{
      transportId: string
      transportRequest: unknown
    }>(),
  },
})
