/**
 * OpenADT-owned MCP prompts for the SAP `abap_*` mesh.
 *
 * The SAP ADT MCP server advertises the `prompts` capability but returns an
 * empty `prompts/list` and an almost-empty `initialize.instructions`. The mesh
 * fills both: a workflow cheat-sheet appended to instructions, plus guided
 * workflows surfaced through `prompts/list` + `prompts/get`.
 *
 * Authored in TypeScript (not markdown) so they compile into the binary with no
 * file I/O at runtime. Set `OPENADT_MCP_NO_GUIDANCE=1` to disable injection.
 */

export type PromptArgument = { name: string; description: string; required?: boolean }

export type PromptDef = {
  name: string
  title: string
  description: string
  arguments?: PromptArgument[]
}

export type PromptGetResult = {
  description: string
  messages: { role: 'user' | 'assistant'; content: { type: 'text'; text: string } }[]
}

/** Workflow cheat-sheet appended to the backend's `initialize.instructions`. */
export const GUIDANCE_INSTRUCTIONS = `# OpenADT ABAP workflow guide

ALWAYS start by calling \`abap_list_destinations\` and pass an exact destination id
(e.g. ABC_000_USER_EN) in EVERY subsequent tool call.

Create an ABAP object:

1. abap_creation-get_all_creatable_objects (what can be created here)
2. abap_creation-get_object_type_details (what input the chosen type needs)
3. abap_creation-run_validation (ALWAYS before create; fix errors and repeat)
4. abap_transport-get (ALWAYS before create — never call abap_transport-create directly)
5. abap_creation-create_object
6. abap_activate_objects (activate before running tests)

Generate a RAP service:

1. abap_generators-list_generators (read each 'description' to pick the right one)
2. abap_generators-get_schema (ask the user for a package name first)
3. abap_generators-generate_objects

Expose / inspect an OData service:

1. abap_business_services-fetch_services (V4: if isPublished=false, STOP and ask the user to publish the binding)
2. wait for the user to pick a specific service + version
3. abap_business_services-fetch_service_information

Run ABAP Unit Tests:

- \`abap_run_unit_tests\` expects URIs in VS Code ABAP virtual filesystem format
- Format: \`abap://project/repotree-v1/{destination}/{path-to-file}.clas.abap\`
- URL-encode paths with spaces as \`%20\`; the file need not be open in VS Code
- Returns "No tests found" (OK) or test execution results

Quality: run \`abap_run_unit_tests\` after changes; \`abap_activate_objects\` before testing.`

type PromptEntry = {
  def: PromptDef
  body: string
  defaults: Record<string, string>
}

const PROMPTS: PromptEntry[] = [
  {
    def: {
      name: 'create-abap-object',
      title: 'Create an ABAP object',
      description:
        'Guided workflow to create a new ABAP object (class, table, CDS view, …) on a destination, with transport handling and activation.',
      arguments: [
        { name: 'destination', description: 'Destination id, e.g. ABC_000_USER_EN' },
        { name: 'objectType', description: 'Object type to create (optional)' },
        { name: 'name', description: 'Object name (optional)' },
        { name: 'package', description: 'Target package (optional)' },
      ],
    },
    defaults: {
      destination: '<destination id>',
      objectType: 'ask the user',
      name: 'the object',
      package: 'the target package',
    },
    body: `Create an ABAP object on destination {{destination}}.

Follow this chain, one step at a time, and stop to ask me whenever a value is missing:

1. abap_list_destinations — confirm the destination is active.
2. abap_creation-get_all_creatable_objects — list creatable types (target type: {{objectType}}).
3. abap_creation-get_object_type_details — find out what input the type needs.
4. abap_creation-run_validation — validate {{name}} in {{package}}; if it returns errors, fix the input and validate again.
5. abap_transport-get — resolve the transport request (NEVER call abap_transport-create directly). If no transport is available (new objects / dev-only destinations), stop and ask me: I may have a transport number to give you, or I may want to skip the transport entirely (local object, no transport layer).
6. abap_creation-create_object — create it.
7. abap_activate_objects — activate the new object.
   Report what was created and its transport request.`,
  },
  {
    def: {
      name: 'generate-rap-service',
      title: 'Generate a RAP service',
      description:
        'Guided workflow to generate RAP objects (tables, CDS, behavior, service definition/binding) with an ABAP generator.',
      arguments: [
        { name: 'destination', description: 'Destination id' },
        { name: 'package', description: 'Target package (required by generators)' },
        {
          name: 'scenario',
          description: "What to generate, e.g. 'UI service over table' (optional)",
        },
      ],
    },
    defaults: {
      destination: '<destination id>',
      package: 'ask the user for a package',
      scenario: 'the requested scenario',
    },
    body: `Generate a RAP service on destination {{destination}} for {{scenario}}.

1. abap_generators-list_generators — read each 'description'; pick the generator that matches the scenario (e.g. 'x-ui-service' for a full RAP + UI service).
2. abap_generators-get_schema — give a package name first ({{package}}). If the schema lists referenceObjectTypes, ask me for those too.
3. abap_generators-generate_objects — generate; this resolves transport via abap_transport-get automatically.
   Show me the generated objects and the service binding name.`,
  },
  {
    def: {
      name: 'expose-odata-service',
      title: 'Inspect / expose an OData service',
      description:
        'Guided workflow to fetch OData service information from a service binding (needed before Fiori app generation).',
      arguments: [
        { name: 'destination', description: 'Destination id' },
        { name: 'serviceBindingName', description: 'Service binding name (optional)' },
      ],
    },
    defaults: {
      destination: '<destination id>',
      serviceBindingName: 'the service binding',
    },
    body: `Fetch OData service information on destination {{destination}} for {{serviceBindingName}}.

1. abap_business_services-fetch_services — get services for the binding. For OData V4: if isPublished is false, STOP and tell me to publish the service binding first.
2. Present the available services and versions and WAIT for me to pick one.
3. abap_business_services-fetch_service_information — only after I selected a specific service version; return the service URL, entity sets and navigations.`,
  },
  {
    def: {
      name: 'activate-and-test',
      title: 'Activate and run unit tests',
      description: 'Activate ABAP objects and run ABAP Unit tests for them.',
      arguments: [
        { name: 'destination', description: 'Destination id' },
        { name: 'objects', description: 'Object name(s) to activate/test (optional)' },
      ],
    },
    defaults: {
      destination: '<destination id>',
      objects: 'the changed objects',
    },
    body: `Activate and test on destination {{destination}} for {{objects}}.

1. abap_activate_objects — activate the objects (checks + copies inactive→active).
2. abap_run_unit_tests — run ABAP Unit tests for the same objects.
   Summarize activation results and test outcomes; surface any failures verbatim.`,
  },
]

const PROMPT_BY_NAME = new Map(PROMPTS.map((p) => [p.def.name, p]))

/** Replace `{{key}}` tokens; unknown/blank keys fall back to `<key>`. */
function render(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    values[key]?.trim() ? values[key]! : `<${key}>`
  )
}

/** Whether guidance injection is enabled (default on). */
export function guidanceEnabled(): boolean {
  const raw = process.env.OPENADT_MCP_NO_GUIDANCE?.trim().toLowerCase()
  return !(raw === '1' || raw === 'true' || raw === 'yes')
}

/** Prompt definitions for `prompts/list`. */
export function listPrompts(): PromptDef[] {
  return guidanceEnabled() ? PROMPTS.map((p) => p.def) : []
}

export function isPrompt(name: string): boolean {
  return guidanceEnabled() && PROMPT_BY_NAME.has(name)
}

/** Build a `prompts/get` result, or undefined if the name is unknown/disabled. */
export function getPrompt(
  name: string,
  args: Record<string, string> = {}
): PromptGetResult | undefined {
  if (!guidanceEnabled()) {
    return undefined
  }
  const entry = PROMPT_BY_NAME.get(name)
  if (!entry) {
    return undefined
  }
  const text = render(entry.body, { ...entry.defaults, ...args })
  return {
    description: entry.def.description,
    messages: [{ role: 'user', content: { type: 'text', text } }],
  }
}

/** Append the workflow cheat-sheet to the backend's instructions string. */
export function augmentInstructions(backend: string | undefined): string {
  const base = (backend ?? '').trim()
  if (!guidanceEnabled()) {
    return base
  }
  return base ? `${base}\n\n${GUIDANCE_INSTRUCTIONS}` : GUIDANCE_INSTRUCTIONS
}
