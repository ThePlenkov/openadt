/**
 * Pure TypeScript contract system with phantom types.
 */
export type Type<T> = {
  readonly __type?: T
}

export const type = <T>(): Type<T> => ({}) as Type<T>

export type LspMethodSpec = {
  method: string
  types: {
    params: Type<unknown>
    response: Type<unknown>
  }
}

export const lspEndpoint = <const E extends LspMethodSpec>(e: E): E => e

export type LspEndpoint<E extends LspMethodSpec = LspMethodSpec> = E
