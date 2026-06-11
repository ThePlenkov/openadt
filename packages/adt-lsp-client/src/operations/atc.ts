import { getCheckVariants, runCheck as runCheckContract } from '@openadt/adt-lsp-contracts'
import { callLspContract } from '../lsp/client/call-lsp-contract'
import { resolveRepotreeUri } from '../lsp/client/resolve-repotree-uri'
import type { DestinationUri, LspTransport } from './types'

export async function getAtcCheckVariants(
  transport: LspTransport,
  args: DestinationUri & { quickPickUserInput?: string }
) {
  const objectUri = await resolveRepotreeUri(transport, args)
  return callLspContract(getCheckVariants, transport, {
    objectUri,
    quickPickUserInput: args.quickPickUserInput ?? '*',
  })
}

export async function runAtcCheck(
  transport: LspTransport,
  args: DestinationUri & { checkVariant?: string }
) {
  const objectUri = await resolveRepotreeUri(transport, args)
  return callLspContract(runCheckContract, transport, {
    objectUri,
    checkVariant: args.checkVariant ?? '',
  })
}
