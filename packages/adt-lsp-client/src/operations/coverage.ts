import {
  getCoverage as getCoverageContract,
  loadStatementResults as loadStatementResultsContract,
} from '@openadt/adt-lsp-contracts'
import { callLspContract } from '../lsp/client/call-lsp-contract'
import type { DestinationUri, LspTransport } from './types'

export async function getCoverage(transport: LspTransport, args: DestinationUri) {
  return callLspContract(getCoverageContract, transport, args)
}

export async function loadStatementResults(
  transport: LspTransport,
  args: { destination: string; uri?: string; measurementId?: string }
) {
  return callLspContract(loadStatementResultsContract, transport, {
    destination: args.destination,
    uri: args.uri ?? args.measurementId ?? '',
  })
}
