import { z } from 'zod'
import { tool } from '@openadt/mcp-tools'
import type { LspTransport } from '@openadt/adt-lsp-client'
import { getAtcCheckVariants } from '@openadt/adt-lsp-client'
import { toMcpError, toMcpJson } from '../mcp-result'

const schema = z.object({
  destination: z.string().describe('SAP destination'),
  uri: z
    .string()
    .describe('Object URI (ADT path or repotree URI; tool resolves via getLsUri if needed)'),
  quickPickUserInput: z
    .string()
    .optional()
    .describe('ATC variant filter (use * for all; empty is rejected by SAP backend)'),
})

export const adt_get_check_variants = tool({
  name: 'adt_get_check_variants',
  description: 'Get ATC check variants for an object (adtLs/atc/getCheckVariants).',
  inputSchema: schema,
  handler: async (args: z.infer<typeof schema>, transport: LspTransport) => {
    try {
      return toMcpJson(await getAtcCheckVariants(transport, args))
    } catch (err) {
      return toMcpError(err)
    }
  },
})
