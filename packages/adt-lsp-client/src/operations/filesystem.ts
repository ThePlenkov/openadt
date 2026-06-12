import {
  forceRefresh as forceRefreshContract,
  getExternalLinks as getExternalLinksContract,
  getFileLockStatus as getFileLockStatusContract,
  getFolderUri as getFolderUriContract,
  getObjectName as getObjectNameContract,
  getPackageName as getPackageNameContract,
  lockFile as lockFileContract,
  toggleVersion as toggleVersionContract,
  unlockFile as unlockFileContract,
} from '@openadt/adt-lsp-contracts'
import { callLspContract } from '../lsp/client/call-lsp-contract'
import { resolveRepotreeUri } from '../lsp/client/resolve-repotree-uri'
import type { DestinationUri, LspTransport } from './types'

async function resolveUriArgs(transport: LspTransport, args: DestinationUri) {
  const objectUri = await resolveRepotreeUri(transport, args)
  return { destination: args.destination, uri: objectUri }
}

export async function forceRefresh(transport: LspTransport, args: DestinationUri) {
  const resolved = await resolveUriArgs(transport, args)
  return callLspContract(forceRefreshContract, transport, resolved)
}

export async function lockFile(transport: LspTransport, args: DestinationUri) {
  const resolved = await resolveUriArgs(transport, args)
  return callLspContract(lockFileContract, transport, resolved)
}

export async function unlockFile(transport: LspTransport, args: DestinationUri) {
  const resolved = await resolveUriArgs(transport, args)
  return callLspContract(unlockFileContract, transport, resolved)
}

export async function toggleVersion(transport: LspTransport, args: DestinationUri) {
  const resolved = await resolveUriArgs(transport, args)
  return callLspContract(toggleVersionContract, transport, resolved)
}

export async function getFileLockStatus(transport: LspTransport, args: DestinationUri) {
  const resolved = await resolveUriArgs(transport, args)
  return callLspContract(getFileLockStatusContract, transport, resolved)
}

export async function getObjectName(transport: LspTransport, args: DestinationUri) {
  const resolved = await resolveUriArgs(transport, args)
  return callLspContract(getObjectNameContract, transport, resolved)
}

export async function getPackageName(transport: LspTransport, args: DestinationUri) {
  const resolved = await resolveUriArgs(transport, args)
  return callLspContract(getPackageNameContract, transport, resolved)
}

export async function getFolderUri(transport: LspTransport, args: DestinationUri) {
  const resolved = await resolveUriArgs(transport, args)
  return callLspContract(getFolderUriContract, transport, resolved)
}

export async function getExternalLinks(transport: LspTransport, args: DestinationUri) {
  const resolved = await resolveUriArgs(transport, args)
  return callLspContract(getExternalLinksContract, transport, resolved)
}
