import { describe, expect, test } from 'bun:test'
import { z } from 'zod'
import { tool, type ToolTransport } from './tool-factory'

describe('tool factory', () => {
  test('creates tool definition with correct structure', () => {
    const testTool = tool({
      name: 'test-tool',
      description: 'A test tool',
      inputSchema: z.object({
        param1: z.string(),
        param2: z.number().optional(),
      }),
      handler: async (args, _transport) => {
        return {
          content: [{ type: 'text', text: `Param1: ${args.param1}` }],
        }
      },
    })

    expect(testTool.name).toBe('test-tool')
    expect(testTool.description).toBe('A test tool')
    expect(testTool.inputSchema).toBeDefined()
  })

  test('handler receives correct arguments', async () => {
    const mockTransport = {} as ToolTransport
    const testTool = tool({
      name: 'echo',
      description: 'Echo tool',
      inputSchema: z.object({
        message: z.string(),
      }),
      handler: async (args, _transport) => {
        return {
          content: [{ type: 'text', text: args.message }],
        }
      },
    })

    const result = await testTool.handler({ message: 'hello' }, mockTransport)
    expect(result.content).toEqual([{ type: 'text', text: 'hello' }])
  })

  test('supports optional parameters', async () => {
    const mockTransport = {} as ToolTransport
    const testTool = tool({
      name: 'optional',
      description: 'Tool with optional param',
      inputSchema: z.object({
        required: z.string(),
        optional: z.string().optional(),
      }),
      handler: async (args, _transport) => {
        return {
          content: [
            {
              type: 'text',
              text: `${args.required} ${args.optional ?? 'default'}`,
            },
          ],
        }
      },
    })

    const result1 = await testTool.handler({ required: 'test' }, mockTransport)
    expect(result1.content[0]?.text).toBe('test default')

    const result2 = await testTool.handler({ required: 'test', optional: 'custom' }, mockTransport)
    expect(result2.content[0]?.text).toBe('test custom')
  })

  test('supports isError flag', async () => {
    const mockTransport = {} as ToolTransport
    const testTool = tool({
      name: 'error-tool',
      description: 'Tool that returns error',
      inputSchema: z.object({
        shouldError: z.boolean(),
      }),
      handler: async (args, _transport) => {
        return {
          content: [{ type: 'text', text: args.shouldError ? 'error' : 'success' }],
          isError: args.shouldError,
        }
      },
    })

    const successResult = await testTool.handler({ shouldError: false }, mockTransport)
    expect(successResult.isError).toBe(false)

    const errorResult = await testTool.handler({ shouldError: true }, mockTransport)
    expect(errorResult.isError).toBe(true)
  })
})
