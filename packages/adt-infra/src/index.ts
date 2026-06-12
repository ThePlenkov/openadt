export {
  createClientPipeTransport,
  createMessageConnection,
  generateRandomPipeName,
  ParameterStructures,
  Trace,
  TraceFormat,
  type MessageConnection,
} from './rpc'

export {
  createMcpLog,
  createToolLogger,
  isMcpDebugEnabled,
  type McpLog,
  eclipseWorkspaceLogPath,
  redactSecrets,
} from './log'

export {
  sleep,
  spawnAdtLsc,
  killProcessTree,
  killProcessByPid,
  waitForProcessExit,
} from './process'

export {
  buildAdtLscSpawnRuntime,
  isVsCodeAdtWorkspacePath,
  type WorkspacePath,
  type OpenAdtRuntimePaths,
  type AdtLscSpawnRuntime,
} from './runtime-env'

export { Env, envVar, isTruthyEnv } from './env'

export { SEMANTIC_CACHE_SUFFIX, DESTINATION_FILE } from './cache-paths'

export {
  locateAdtLs,
  resolveAdtLscFromExtension,
  findExtensionRoots,
  pickNewestExtension,
} from './locate'
