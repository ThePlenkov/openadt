/**
 * Check transport lock contract.
 * LSP method: adtLs/cts/transport/checkTransportForObjectLock
 */
import { lspEndpoint, type, type LspEndpoint } from '@openadt/lsp-client'

export const checkTransportForObjectLock: LspEndpoint = lspEndpoint({
  method: 'adtLs/cts/transport/checkTransportForObjectLock',
  types: {
    params: type<{
      objectInfo: { objectUri: string }
      operationType: 'MODIFICATION' | 'CREATION'
    }>(),
    response: type<{
      isTransportCheckSuccessful: boolean
      isRecordingRequired?: boolean
      isLockedInRequests?: boolean
      isRecordingOnlyInLockedRequest?: boolean
      transports?: unknown[]
      locks?: unknown[]
      checkMessages?: {
        infoMessages?: unknown[]
        warningMessages?: unknown[]
        errorMessages?: unknown[]
      }
    }>(),
  },
})
