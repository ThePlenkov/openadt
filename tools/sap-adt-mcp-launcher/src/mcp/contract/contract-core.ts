/**
 * MCP contract core types and helpers.
 * Defines the contract format for MCP tools, prompts, and resources.
 */

// Re-use phantom types from LSP contract core
export type Type<T> = { readonly __type?: T };
export const type = <T>(): Type<T> => ({}) as Type<T>;

/**
 * MCP tool contract specification.
 */
export type McpToolSpec = {
  name: string;
  description: string;
  types: {
    input: Type<Record<string, unknown>>;
    output: Type<unknown>;
  };
};

/**
 * Create an MCP tool contract.
 */
export const mcpTool = <const E extends McpToolSpec>(e: E): E => e;

/**
 * MCP prompt contract specification.
 */
export type McpPromptSpec = {
  name: string;
  description: string;
  types: {
    arguments?: Type<Record<string, unknown>>;
  };
};

/**
 * Create an MCP prompt contract.
 */
export const mcpPrompt = <const E extends McpPromptSpec>(e: E): E => e;

/**
 * MCP resource contract specification.
 */
export type McpResourceSpec = {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  types: {
    output: Type<unknown>;
  };
};

/**
 * Create an MCP resource contract.
 */
export const mcpResource = <const E extends McpResourceSpec>(e: E): E => e;
