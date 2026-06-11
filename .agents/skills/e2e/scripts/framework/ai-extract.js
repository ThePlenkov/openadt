/**
 * Extract parameters from natural language prompt using AI interpretation.
 * This is a placeholder for actual AI integration.
 *
 * Implementations should:
 * - Use an LLM to interpret the prompt
 * - Extract relevant parameters based on the scenario context
 * - Return extracted parameters as key-value pairs
 *
 * @param prompt - Natural language prompt from user
 * @param ctx - Current run context with existing parameters
 * @returns Extracted parameters to merge into context
 */
export function extractParamsFromPrompt(prompt, ctx) {
  // Placeholder: return empty object
  // Implementations should replace this with actual AI interpretation
  return {}
}
/**
 * Merge AI-extracted parameters with existing context.
 * Extracted params take precedence over defaults.
 *
 * @param ctx - Current run context
 * @param extracted - Parameters extracted from AI interpretation
 * @returns Merged context with extracted parameters
 */
export function mergeExtractedParams(ctx, extracted) {
  return {
    ...ctx,
    ...extracted,
  }
}
//# sourceMappingURL=ai-extract.js.map
