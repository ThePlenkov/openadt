export const ADT_LSP_WORKFLOW_PROMPT = 'adt_lsp_workflow'

export type GuidancePromptDef = {
  name: string
  description: string
}

export type GuidancePromptResult = {
  description?: string
  messages: Array<{
    role: 'user' | 'assistant'
    content: { type: 'text'; text: string }
  }>
}

const WORKFLOW_TEXT = `# OpenADT adt-lsp-mcp workflow

This MCP server (\`@openadt/adt-lsp-mcp\`) exposes 26 **\`adt_*\` tools** that call SAP ADT Language Server (\`adt-lsc\`) over **pipe LSP directly**. It does **not** use the HTTP MCP bridge (\`adtLs/mcp/startMCPServer\`). Contrast: \`openadt-mcp serve --stdio\` proxies SAP's HTTP MCP endpoint.

## Before every tool call

1. Ask the user for their **destination id** (\`SID_CLIENT_USER_LANG\`, e.g. \`ABC_200_USER_EN\`) unless already known.
2. Pass that exact id as \`destination\` in every \`adt_*\` tool call.
3. The server was started with one destination; the id must match a row in \`~/.adtls/destinations.json\`.

## Startup and logon

- MCP \`initialize\`, \`tools/list\`, and \`prompts/list\` respond immediately on stdio.
- LSP connect + \`createProject\` + \`ensureLoggedOn\` runs in the background.
- First \`tools/call\` waits for logon (cold SSO can take up to ~300s).
- \`destinationsStorePath\` is the **\`~/.adtls\` directory**, not \`destinations.json\`.

## Object URI chain (getLsUri-first)

Many operations need a **repotree/AFF URI**, not an ADT object path:

\`\`\`
adt_quick_search  →  references[].uri  (ADT path, e.g. /sap/bc/adt/oo/classes/cl_x)
getLsUri          →  { uri }            (repotree URI for file/transport/lock ops)
\`\`\`

- Search field is **\`pattern\`** (in \`adt_quick_search\`), not \`query\`.
- \`getLsUri\` param is **\`adtUri\`** (the ADT path from quick search).
- Never hand-build repotree URIs; always use what \`getLsUri\` returns.

## Transport tools (\`adtLs/cts/transport/*\`)

Transport LSP methods live under **\`adtLs/cts/transport/\`**, not \`adtLs/transport/\`.

| Tool | Purpose |
| ---- | ------- |
| \`adt_search_transports_simple\` | List modifiable transports for destination |
| \`adt_search_transports\` | Advanced transport search |
| \`adt_check_transport_lock\` | Check if object needs transport recording (calls getLsUri internally) |
| \`adt_create_transport\` | Create transport for object lock |
| \`adt_assign_transport\` | Assign transport to object |

For lock check: after getLsUri, LSP expects \`{ objectInfo: { objectUri }, operationType: 'MODIFICATION' }\`.

Typical workflow: search transports → check lock → create or assign transport.

## MCP result shape

\`tools/call\` success returns \`{ content: [{ type: 'text', text: '...' }], isError?: boolean }\` as the JSON-RPC **result** field directly.

## Standard e2e fixtures

Use standard SAP classes that exist on most systems, e.g. **\`CL_ABAP_TYPEDESCR\`** (\`/sap/bc/adt/oo/classes/cl_abap_typedescr\`), not custom \`ZCL_*\` unless the user confirms they exist.
`

export function guidancePromptDefs(): GuidancePromptDef[] {
  return [
    {
      name: ADT_LSP_WORKFLOW_PROMPT,
      description:
        'How adt-lsp-mcp works: direct LSP stdio, destination id, getLsUri chain, cts/transport namespace',
    },
  ]
}

export function isGuidancePrompt(name: string): boolean {
  return name === ADT_LSP_WORKFLOW_PROMPT
}

export function getGuidancePrompt(name: string): GuidancePromptResult {
  if (!isGuidancePrompt(name)) {
    throw new Error(`Unknown guidance prompt: ${name}`)
  }
  return {
    description: guidancePromptDefs()[0]?.description,
    messages: [
      {
        role: 'user',
        content: { type: 'text', text: WORKFLOW_TEXT },
      },
    ],
  }
}
