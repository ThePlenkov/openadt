/**
 * Standardized error codes for agent tools.
 * Maps LSP errors and domain-specific errors to consistent codes.
 */
export enum AgentErrorCode {
  LOCKED_BY_OTHER = "LOCKED_BY_OTHER",
  NO_TRANSPORT = "NO_TRANSPORT",
  NOT_FOUND = "NOT_FOUND",
  INVALID_URI = "INVALID_URI",
  THROTTLED = "THROTTLED",
  INTERNAL = "INTERNAL",
  LSP_ERROR = "LSP_ERROR",
  TIMEOUT = "TIMEOUT",
}

export function agentError(
  code: AgentErrorCode,
  message: string,
  destination?: string,
): { code: string; message: string; destination?: string } {
  return { code, message, destination };
}
