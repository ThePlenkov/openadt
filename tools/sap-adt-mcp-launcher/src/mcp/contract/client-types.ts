/**
 * Type inference utilities for MCP contracts.
 * Extracts input and output types from contract definitions.
 */
import type {
  Type,
  McpToolSpec,
  McpPromptSpec,
  McpResourceSpec,
} from "./contract-core.js";

/**
 * Infer the actual type from a phantom Type<T>
 */
type Infer<T> = T extends Type<infer U> ? U : never;

/**
 * Extract input type from an MCP tool contract
 */
export type McpToolInput<E extends McpToolSpec> = Infer<E["types"]["input"]>;

/**
 * Extract output type from an MCP tool contract
 */
export type McpToolOutput<E extends McpToolSpec> = Infer<E["types"]["output"]>;

/**
 * Extract arguments type from an MCP prompt contract
 */
export type McpPromptArguments<E extends McpPromptSpec> =
  E["types"]["arguments"] extends Type<infer U> ? U : never;

/**
 * Extract output type from an MCP resource contract
 */
export type McpResourceOutput<E extends McpResourceSpec> = Infer<
  E["types"]["output"]
>;
