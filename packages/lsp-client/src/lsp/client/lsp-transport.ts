/**
 * Transport interface and implementations for LSP contracts.
 * Supports both direct LSP connection (standalone mode) and HTTP (shared mode).
 */
import { ParameterStructures, type MessageConnection } from '@openadt/adt-infra'

export type LspParamStructure = 'byName' | 'byPosition'

/**
 * Transport interface for sending LSP method requests.
 * Abstracts the transport mechanism (LSP or HTTP).
 */
export interface LspTransport {
  sendRequest(method: string, params: unknown, paramStructure?: LspParamStructure): Promise<unknown>
  /** Optional — required for textDocument/didOpen prewarm in standalone LSP mode. */
  sendNotification?(method: string, params: unknown): void
}

/**
 * LSP transport implementation using direct MessageConnection.
 * Used in standalone mode where the stdio bridge owns the LSP connection.
 */
export class LspConnectionTransport implements LspTransport {
  constructor(private connection: MessageConnection) {}

  async sendRequest(
    method: string,
    params: unknown,
    paramStructure: LspParamStructure = 'byName'
  ): Promise<unknown> {
    if (paramStructure === 'byPosition') {
      // Single scalar param — same as marianfoo/adt-ls (auto → JSON array of one).
      return this.connection.sendRequest(method, params)
    }
    return this.connection.sendRequest(method, ParameterStructures.byName, params)
  }

  sendNotification(method: string, params: unknown): void {
    this.connection.sendNotification(method, ParameterStructures.byName, params)
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
    private fetchFn: typeof fetch = fetch
  ) {}

  async sendRequest(
    method: string,
    params: unknown,
    _paramStructure: LspParamStructure = 'byName'
  ): Promise<unknown> {
    const url = `${this.baseUrl}/lsp/${method}`
    const response = await this.fetchFn(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`HTTP ${response.status}: ${text}`)
    }

    return response.json()
  }
}
