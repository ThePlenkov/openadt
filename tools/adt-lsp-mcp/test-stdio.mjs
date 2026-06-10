#!/usr/bin/env bun
/**
 * Simple test to verify ADT LSP MCP server responds to MCP stdio messages
 */
import { spawn } from 'node:child_process'
import { frameMcpMessage } from '@openadt/mcp-framing'

const server = spawn('node', ['dist/main.mjs'], {
  cwd: new URL('./', import.meta.url).pathname,
  stdio: ['pipe', 'pipe', 'inherit'],
})

let serverReady = false
let toolsListReceived = false

server.stderr.on('data', (data) => {
  const msg = data.toString()
  console.error('[SERVER STDERR]', msg)
  if (msg.includes('started')) serverReady = true
})

server.stdout.on('data', (data) => {
  const msg = data.toString()
  console.log('[SERVER STDOUT]', msg)

  try {
    // Try to parse as JSON-RPC response
    const lines = msg.split('\n').filter(Boolean)
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line)
        if (parsed.result?.tools) {
          toolsListReceived = true
          console.log('✓ Received tools/list response')
          console.log(`  Tools count: ${parsed.result.tools.length}`)
          console.log(
            `  Sample tools: ${parsed.result.tools
              .slice(0, 3)
              .map((t) => t.name)
              .join(', ')}`
          )
        }
      } catch {
        // Not JSON, ignore
      }
    }
  } catch (err) {
    console.error('Parse error:', err)
  }
})

// Wait for server to start
await new Promise((resolve) => setTimeout(resolve, 500))

if (!serverReady) {
  console.error('Server did not start properly')
  process.exit(1)
}

// Send initialize
console.log('[CLIENT] Sending initialize...')
const initMsg = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '1.0' },
  },
})
server.stdin.write(frameMcpMessage(initMsg))

await new Promise((resolve) => setTimeout(resolve, 200))

// Send initialized notification
console.log('[CLIENT] Sending initialized...')
const initNotif = JSON.stringify({
  jsonrpc: '2.0',
  method: 'notifications/initialized',
})
server.stdin.write(frameMcpMessage(initNotif))

await new Promise((resolve) => setTimeout(resolve, 200))

// Request tools/list
console.log('[CLIENT] Sending tools/list...')
const toolsListMsg = JSON.stringify({
  jsonrpc: '2.0',
  id: 2,
  method: 'tools/list',
})
server.stdin.write(frameMcpMessage(toolsListMsg))

// Wait for response
await new Promise((resolve) => setTimeout(resolve, 1000))

server.stdin.end()

if (toolsListReceived) {
  console.log('\n✅ MCP stdio test PASSED')
  process.exit(0)
} else {
  console.log('\n❌ MCP stdio test FAILED - no tools/list response')
  process.exit(1)
}
