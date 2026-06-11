import type { Scenario, ScenarioCode, ScenarioStep } from './types'
export declare function scenariosDir(root: string): string
type Frontmatter = {
  code?: string
  id?: string
  title?: string
  tags?: string[]
  mode?: Scenario['mode']
  given?: string
  when?: string
  then?: string
  steps?: ScenarioStep[]
}
/** Expected basename: `<prefix>-N-<id>.md` (sorted by N, readable slug from frontmatter `id`). */
export declare function expectedScenarioFilename(code: ScenarioCode, id: string): string
export declare function normalizeScenarioCode(raw: string): ScenarioCode
/** Split YAML frontmatter and markdown body (`---` … `---`). */
export declare function parseScenarioMarkdown(raw: string): {
  meta: Frontmatter
  body: string
}
export declare function toScenario(file: string, meta: Frontmatter, body: string): Scenario
export declare function loadScenariosFromDir(dir: string): Scenario[]
export declare function loadScenariosFromRoot(
  root: string,
  selector?: string,
  options?: {
    skipInvalid?: boolean
  }
): Scenario[]
/** Match by stable code or slug id. */
export declare function filterScenarios(all: Scenario[], selector: string | undefined): Scenario[]
export declare function findScenarioByCode(all: Scenario[], code: string): Scenario | undefined
export {}
//# sourceMappingURL=scenarios.d.ts.map
