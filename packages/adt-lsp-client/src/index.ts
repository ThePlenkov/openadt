export {
  connectAdtLanguageServer,
  disposeLspSession,
  buildLspInitializeParams,
  ensureDestinationProjectAndLogon,
  type LspSession,
  type ConnectAdtLanguageServerOptions,
} from './lsp-client'

export {
  DEFAULT_LOGON_TIMEOUT_MS,
  ensureDestinationLoggedOn,
  registerLogonHandlers,
} from './logon-handlers'

export { callLspContract } from './lsp/client/call-lsp-contract'

export {
  HttpLspTransport,
  LspConnectionTransport,
  type LspParamStructure,
  type LspTransport,
} from './lsp/client/lsp-transport'

export { isRepotreeUri, resolveRepotreeUri } from './lsp/client/resolve-repotree-uri'

export { applyTextEdits, type TextEdit } from './lsp/client/apply-text-edits'

export { enrichFindReferencesError } from './lsp/client/find-references-error'

export {
  withOpenDocument,
  primeSemanticTokens,
  resolveLspPosition,
  type WithOpenDocumentOptions,
  type OpenDocumentContext,
  type LspPosition,
} from './lsp/client/with-open-document'

export {
  prewarmRepotreeObject,
  type PrewarmRepotreeObjectOptions,
} from './lsp/client/prewarm-repotree-object'

export { prewarmDestination } from './lsp/client/prewarm-destination'

export {
  lspEndpoint,
  type,
  type LspMethodSpec,
  type LspEndpoint,
  type LspContractInput,
  type LspContractResponse,
} from '@openadt/adt-lsp-contracts'

export * from './operations'
