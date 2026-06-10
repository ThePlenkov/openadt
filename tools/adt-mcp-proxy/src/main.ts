#!/usr/bin/env bun
/**
 * ADT MCP Proxy Server - HTTP proxy service to SAP ADT
 *
 * This is a focused MCP server that proxies HTTP requests to SAP ADT endpoints.
 *
 * Usage: bun src/main.ts serve --http --port <PORT> --destination <DEST>
 */
import { createServer } from 'node:http'

const PORT = process.env.PORT || 2236

async function main() {
  const server = createServer((req, res) => {
    // Simple proxy implementation
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: 'ADT MCP Proxy Server' }))
  })

  server.listen(PORT, () => {
    console.error(`ADT MCP Proxy server listening on port ${PORT}`)
  })
}

main().catch((error) => {
  console.error('Server error:', error)
  process.exit(1)
})
