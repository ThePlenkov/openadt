/**
 * Generic LSP contract caller.
 * Calls LSP methods using a transport-agnostic contract.
 */
import type { LspMethodSpec } from '@openadt/adt-lsp-contracts'
import type { LspParamStructure, LspTransport } from './lsp-transport'
import type { LspContractInput, LspContractResponse } from '@openadt/adt-lsp-contracts'

/**
 * Call an LSP method using a contract and transport.
 * Provides type-safe request/response handling for any transport implementation.
 *
 * @param contract - LSP method contract with method name and types
 * @param transport - Transport implementation (LSP or HTTP)
 * @param params - Request parameters matching contract input type
 * @param options - Optional timeout configuration
 * @returns Response matching contract response type
 */
export async function callLspContract<E extends LspMethodSpec>(
  contract: E,
  transport: LspTransport,
  params: LspContractInput<E>,
  options?: { timeoutMs?: number; paramStructure?: LspParamStructure }
): Promise<LspContractResponse<E>> {
  const { timeoutMs, paramStructure } = options ?? {}

  const send = () => transport.sendRequest(contract.method, params, paramStructure)

  if (timeoutMs) {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`LSP call timed out after ${timeoutMs}ms`)), timeoutMs)
    })

    const result = await Promise.race([send(), timeoutPromise])

    return result as LspContractResponse<E>
  }

  return (await send()) as LspContractResponse<E>
}
