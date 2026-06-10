/**
 * Transport interface and implementations for LSP contracts.
 * Supports both direct LSP connection (standalone mode) and HTTP (shared mode).
 */
import { ParameterStructures, type MessageConnection } from "../../infra/rpc";

/**
 * Transport interface for sending LSP method requests.
 * Abstracts the transport mechanism (LSP or HTTP).
 */
export interface LspTransport {
  sendRequest(method: string, params: unknown): Promise<unknown>;
}

/**
 * LSP transport implementation using direct MessageConnection.
 * Used in standalone mode where the stdio bridge owns the LSP connection.
 */
export class LspConnectionTransport implements LspTransport {
  constructor(private connection: MessageConnection) {}

  async sendRequest(method: string, params: unknown): Promise<unknown> {
    return this.connection.sendRequest(
      method,
      ParameterStructures.byName,
      params,
    );
  }
}

/**
 * HTTP transport implementation using fetch.
 * Used in shared mode where the stdio bridge calls daemon endpoints.
 */
export class HttpLspTransport implements LspTransport {
  constructor(
    private baseUrl: string,
    private token: string,
    private fetchFn: typeof fetch = fetch,
  ) {}

  async sendRequest(method: string, params: unknown): Promise<unknown> {
    const url = `${this.baseUrl}/lsp/${method}`;
    const response = await this.fetchFn(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    return response.json();
  }
}
