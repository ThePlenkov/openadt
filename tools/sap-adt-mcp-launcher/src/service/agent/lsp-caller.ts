/**
 * LSP method caller with timeout and error handling.
 * Wraps LSP JSON-RPC calls and maps errors to AgentErrorCode.
 */
import type { MessageConnection } from "../../infra/rpc";
import type { McpLog } from "../../infra/log";
import { AgentErrorCode, agentError } from "./error-codes";

export async function callLspMethod<T>(
  connection: MessageConnection,
  method: string,
  params: unknown,
  options: { timeoutMs?: number; log?: McpLog } = {},
): Promise<T> {
  const { timeoutMs = 30000, log } = options;

  log?.trace(`LSP call: ${method} ${JSON.stringify(params)}`);

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("LSP call timeout")), timeoutMs);
  });

  try {
    const result = await Promise.race([
      connection.sendRequest(method),
      timeoutPromise,
    ]);

    log?.trace(`LSP response: ${method} ${JSON.stringify(result)}`);
    return result as T;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log?.error(`LSP error: ${method}: ${message}`);

    // Map common LSP errors to agent error codes
    if (message.includes("timeout")) {
      throw new Error(
        JSON.stringify(agentError(AgentErrorCode.TIMEOUT, message)),
      );
    }

    throw new Error(
      JSON.stringify(agentError(AgentErrorCode.LSP_ERROR, message)),
    );
  }
}
