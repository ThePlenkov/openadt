/**
 * MCP tool for adt create transport.
 * Uses MCP SDK pattern with Zod schema.
 */
import { z } from 'zod'
import { LSP_METHOD_REPOSITORY_GET_LS_URI } from '@openadt/adt-config'
import { tool } from '@openadt/mcp-tools'
import { createTransportForObjectLock } from '@openadt/adt-services'
import type { LspTransport } from '@openadt/lsp-client'
import { callLspContract } from '@openadt/lsp-client'
import { createToolLogger, isMcpDebugEnabled } from '@openadt/adt-infra'

// Zod schema (single source of truth)
const schema = z.object({
  destination: z
    .string()
    .describe('SAP destination id (SID_CLIENT_USER_LANG, e.g. ABC_200_USER_EN)'),
  uri: z
    .string()
    .describe(
      'Object URI (ADT path or repotree URI; use getLsUri after adt_quick_search when unsure)'
    ),
  operationType: z
    .enum(['CREATION', 'MODIFICATION'])
    .describe('Operation type: CREATION or MODIFICATION'),
  description: z.string().optional().describe('Optional transport description'),
  ctsProject: z.string().optional().describe('Optional CTS project'),
  changeGuid: z.string().optional().describe('Optional change document GUID'),
})

export const adt_create_transport = tool({
  name: 'adt_create_transport',
  description:
    'Create a transport for an object lock (adtLs/cts/transport/createTransportForObjectLock). Check lock with adt_check_transport_lock first.',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    const log = createToolLogger({ verbose: isMcpDebugEnabled() })
    log?.info(`adt_create_transport called with: ${JSON.stringify(args)}`)

    try {
      const lsUriResult = (await transport.sendRequest(LSP_METHOD_REPOSITORY_GET_LS_URI, {
        destination: args.destination,
        adtUri: args.uri,
      })) as { uri?: string }
      const objectUri = lsUriResult?.uri
      if (!objectUri) {
        throw new Error(`getLsUri did not resolve ${args.uri}`)
      }

      const lspResult = await callLspContract(createTransportForObjectLock, transport, {
        description: args.description,
        ctsProject: args.ctsProject,
        changeGuid: args.changeGuid,
        checkData: {
          operationType: args.operationType,
          objectInfo: { objectUri: objectUri },
          transportLayer: undefined,
          isRecordChanges: true,
        },
      })

      log?.info(`LSP call successful: ${JSON.stringify(lspResult)}`)

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
      log?.error(`LSP call failed: ${message}`)
      log?.error(`Full error: ${JSON.stringify(err, Object.getOwnPropertyNames(err))}`)

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
