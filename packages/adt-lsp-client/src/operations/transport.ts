import {
  assignTransportToObject as assignTransportContract,
  checkTransportForObjectLock,
  createTransportForObjectLock,
  searchTransports as searchTransportsContract,
  searchTransportsSimple as searchTransportsSimpleContract,
} from '@openadt/adt-lsp-contracts'
import { callLspContract } from '../lsp/client/call-lsp-contract'
import { resolveRepotreeUri } from '../lsp/client/resolve-repotree-uri'
import type { DestinationUri, LspTransport } from './types'

export async function checkTransportLock(
  transport: LspTransport,
  args: DestinationUri & { operationType?: 'CREATION' | 'MODIFICATION' }
) {
  const objectUri = await resolveRepotreeUri(transport, args)
  return callLspContract(checkTransportForObjectLock, transport, {
    objectInfo: { objectUri },
    operationType: args.operationType ?? 'MODIFICATION',
  })
}

export async function createTransport(
  transport: LspTransport,
  args: DestinationUri & {
    operationType: 'CREATION' | 'MODIFICATION'
    description?: string
    ctsProject?: string
    changeGuid?: string
  }
) {
  const objectUri = await resolveRepotreeUri(transport, args)
  return callLspContract(createTransportForObjectLock, transport, {
    description: args.description,
    ctsProject: args.ctsProject,
    changeGuid: args.changeGuid,
    checkData: {
      operationType: args.operationType,
      objectInfo: { objectUri },
      transportLayer: undefined,
      isRecordChanges: true,
    },
  })
}

export async function assignTransport(
  transport: LspTransport,
  args: DestinationUri & { transportId: string }
) {
  const objectUri = await resolveRepotreeUri(transport, args)
  return callLspContract(assignTransportContract, transport, {
    objectUri,
    transport: args.transportId,
  })
}

export async function searchTransports(
  transport: LspTransport,
  args: {
    destination: string
    number?: string
    owner?: string
    function?: string[]
    status?: string[]
    fromDate?: string
    toDate?: string
    limit?: number
  }
) {
  return callLspContract(searchTransportsContract, transport, {
    destinationId: args.destination,
    number: args.number,
    owner: args.owner,
    function: args.function,
    status: args.status,
    fromDate: args.fromDate,
    toDate: args.toDate,
    limit: args.limit,
  })
}

export async function searchTransportsSimple(
  transport: LspTransport,
  args: { destination: string; owner: string; function: string }
) {
  return callLspContract(searchTransportsSimpleContract, transport, {
    destinationId: args.destination,
    owner: args.owner,
    function: args.function,
  })
}
