/**
 * Central registration point for all agent tools.
 * Imports and registers all tool domains with the AgentRegistry.
 */
import { AgentRegistry } from "./registry";
import { AtcToolSet } from "./atc/atc-tools";
import { LockToolSet } from "./lock/lock-tools";
import { FormatToolSet } from "./format/format-tools";
import { DiagnosticToolSet } from "./diagnostic/diagnostic-tools";
import { ReferencesToolSet } from "./references/references-tools";
import { VersionToolSet } from "./version/version-tools";
import { TransportToolSet } from "./transport/transport-tools";
import { TransportSearchToolSet } from "./transport/transport-search-tools";
import { RepositoryToolSet } from "./repository/repository-tools";
import { ActivationToolSet } from "./activation/activation-tools";
import { RunToolSet } from "./run/run-tools";
import { HoverToolSet } from "./hover/hover-tools";
import { SymbolsToolSet } from "./symbols/symbols-tools";
import { CoverageToolSet } from "./coverage/coverage-tools";
import { MetaToolSet } from "./meta/meta-tools";

/**
 * Create and register all agent tools.
 * Returns a fully populated AgentRegistry.
 */
export function createAgentRegistry(): AgentRegistry {
  const registry = new AgentRegistry();

  // High priority tools
  registry.registerToolSet(new AtcToolSet());
  registry.registerToolSet(new LockToolSet());
  registry.registerToolSet(new FormatToolSet());
  registry.registerToolSet(new DiagnosticToolSet());
  registry.registerToolSet(new ReferencesToolSet());
  registry.registerToolSet(new VersionToolSet());
  registry.registerToolSet(new TransportToolSet());
  registry.registerToolSet(new RepositoryToolSet());

  // Medium priority tools
  registry.registerToolSet(new ActivationToolSet());
  registry.registerToolSet(new RunToolSet());
  registry.registerToolSet(new HoverToolSet());
  registry.registerToolSet(new SymbolsToolSet());
  registry.registerToolSet(new TransportSearchToolSet());
  registry.registerToolSet(new CoverageToolSet());

  // Low priority tools
  registry.registerToolSet(new MetaToolSet());

  return registry;
}

// Re-export for convenience
export {
  AgentRegistry,
  type AgentTool,
  type AgentContext,
  type AgentResult,
} from "./registry";
export { AgentErrorCode, agentError } from "./error-codes";
export { callLspMethod } from "./lsp-caller";
export { parseAdtUri, extractDestination } from "./uri-helper";
export { AgentThrottle } from "./throttle";
