/**
 * Generic LSP contract caller.
 * Calls LSP methods using a transport-agnostic contract.
 */
import type { LspMethodSpec } from "../contract/contract-core.js";
import type { LspTransport } from "./lsp-transport.js";
import type {
  LspContractInput,
  LspContractResponse,
} from "../contract/client-types.js";

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
  options?: { timeoutMs?: number },
): Promise<LspContractResponse<E>> {
  const { timeoutMs } = options ?? {};

  if (timeoutMs) {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("LSP call timeout")), timeoutMs);
    });

    const result = await Promise.race([
      transport.sendRequest(contract.method, params),
      timeoutPromise,
    ]);

    return result as LspContractResponse<E>;
  }

  return (await transport.sendRequest(
    contract.method,
    params,
  )) as LspContractResponse<E>;
}
