/**
 * Pure TypeScript contract system with phantom types.
 * Provides compile-time type safety without runtime dependencies.
 */

/**
 * Phantom type that carries a type at compile time.
 * At runtime, this is just an empty object.
 */
export type Type<T> = {
  readonly __type?: T
}

/**
 * Helper function to create a Type<T>.
 * Used in contract definitions to specify request/response types.
 */
export const type = <T>(): Type<T> => ({}) as Type<T>

/**
 * LSP method contract specification.
 * Defines the method name and its request/response types.
 */
export type LspMethodSpec = {
  /** LSP method name, e.g., "adtLs/transport/searchTransportsSimple" */
  method: string
  types: {
    /** Request parameters type (object, string, or positional array) */
    params: Type<unknown>
    /** Response type */
    response: Type<unknown>
  }
}

/**
 * Helper function to create an LSP method contract.
 * Ensures the contract is treated as const for proper type inference.
 */
export const lspEndpoint = <const E extends LspMethodSpec>(e: E): E => e

/**
 * Portable type for LSP endpoints that can be exported across package boundaries.
 */
export type LspEndpoint<E extends LspMethodSpec = LspMethodSpec> = E
