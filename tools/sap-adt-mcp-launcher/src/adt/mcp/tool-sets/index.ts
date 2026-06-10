/**
 * ADT MCP tool sets index.
 * Exports all tool sets organized by domain.
 */
import { ActivationToolSet } from "./activation-tool-set.js";
import { RepositoryToolSet } from "./repository-tool-set.js";
import { TransportToolSet } from "./transport-tool-set.js";
import { DocumentSymbolToolSet } from "./documentSymbol-tool-set.js";
import { ApplicationRunToolSet } from "./applicationRun-tool-set.js";
import { ReferencesToolSet } from "./references-tool-set.js";
import { FileSystemToolSet } from "./fileSystem-tool-set.js";
import { HoverToolSet } from "./hover-tool-set.js";
import { FormatToolSet } from "./format-tool-set.js";
import { DiagnosticToolSet } from "./diagnostic-tool-set.js";
import { CoverageToolSet } from "./coverage-tool-set.js";
import { AtcToolSet } from "./atc-tool-set.js";

export {
  ActivationToolSet,
  RepositoryToolSet,
  TransportToolSet,
  DocumentSymbolToolSet,
  ApplicationRunToolSet,
  ReferencesToolSet,
  FileSystemToolSet,
  HoverToolSet,
  FormatToolSet,
  DiagnosticToolSet,
  CoverageToolSet,
  AtcToolSet,
};

/**
 * All tool sets for easy registration
 */
export const toolSets = [
  ActivationToolSet,
  RepositoryToolSet,
  TransportToolSet,
  DocumentSymbolToolSet,
  ApplicationRunToolSet,
  ReferencesToolSet,
  FileSystemToolSet,
  HoverToolSet,
  FormatToolSet,
  DiagnosticToolSet,
  CoverageToolSet,
  AtcToolSet,
];
