import type { LspTransport } from '../lsp/client/lsp-transport'

export type DestinationUri = {
  destination: string
  uri: string
}

export type DestinationArgs = {
  destination: string
}

export { type LspTransport }
