/**
 * Type inference utilities for LSP contracts.
 * Extracts request and response types from contract definitions.
 */
import type { Type, LspMethodSpec } from "./contract-core";

/**
 * Infer the actual type from a phantom Type<T>
 */
type Infer<T> = T extends Type<infer U> ? U : never;

/**
 * Extract request parameters type from a contract
 */
export type LspContractInput<E extends LspMethodSpec> = Infer<
  E["types"]["params"]
>;

/**
 * Extract response type from a contract
 */
export type LspContractResponse<E extends LspMethodSpec> = Infer<
  E["types"]["response"]
>;
