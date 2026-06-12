import type { Type, LspMethodSpec } from './contract-core'

type Infer<T> = T extends Type<infer U> ? U : never

export type LspContractInput<E extends LspMethodSpec> = Infer<E['types']['params']>

export type LspContractResponse<E extends LspMethodSpec> = Infer<E['types']['response']>
