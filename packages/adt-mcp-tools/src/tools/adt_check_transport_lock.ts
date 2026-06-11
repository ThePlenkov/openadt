/**
 * MCP tool for adt check transport lock.
 * Uses MCP SDK pattern with Zod schema.
 */
import { z } from 'zod'
import { LSP_METHOD_REPOSITORY_GET_LS_URI } from '@openadt/adt-config'
import { tool } from '@openadt/mcp-tools'
import { checkTransportForObjectLock } from '@openadt/adt-services'
import type { LspTransport } from '@openadt/lsp-client'
import { callLspContract } from '@openadt/lsp-client'

const schema = z.object({
  destination: z
    .string()
    .describe('SAP destination id (SID_CLIENT_USER_LANG, e.g. ABC_200_USER_EN)'),
  uri: z
    .string()
    .describe(
      'ADT object path from adt_quick_search (e.g. /sap/bc/adt/oo/classes/cl_x); tool resolves repotree URI via getLsUri'
    ),
  transportId: z
    .string()
    .optional()
    .describe('Optional; not used for lock check (LSP uses objectInfo + operationType)'),
})

export const adt_check_transport_lock = tool({
  name: 'adt_check_transport_lock',
  description:
    'Check if an ABAP object requires transport recording. This tool calls getLsUri internally to resolve the repotree URI; do NOT call adt_get_ls_uri first. Pass ADT path from adt_quick_search as uri. For workflow guidance, call MCP prompt "adt_lsp_workflow".',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      const lsUriResult = (await transport.sendRequest(LSP_METHOD_REPOSITORY_GET_LS_URI, {
        destination: args.destination,
        adtUri: args.uri,
      })) as { uri?: string }
      const objectUri = lsUriResult?.uri
      if (!objectUri) {
        throw new Error(`getLsUri did not resolve ${args.uri}`)
      }

      const lspResult = await callLspContract(checkTransportForObjectLock, transport, {
        objectInfo: { objectUri },
        operationType: 'MODIFICATION',
      })

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(lspResult, null, 2),
          },
        ],
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${message}`,
          },
        ],
        isError: true,
      }
    }
  },
})
