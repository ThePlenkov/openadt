import { describe, expect, test } from 'bun:test'
import { createServer } from 'node:http'
import type { MeshMcpServer } from '../mesh-server'
import { serveHttpOnFreePort } from './http'

/** Bind an ephemeral port and return it (kept open until `close`). */
function occupyPort(): Promise<{ port: number; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const srv = createServer()
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address()
      const port = typeof addr === 'object' && addr ? addr.port : 0
      resolve({
        port,
        close: () => new Promise<void>((done) => srv.close(() => done())),
      })
    })
  })
}

// serveHttp only touches the server inside the request handler, never during
// listen, so a bare stub is enough to exercise port binding.
const stubServer = {} as unknown as MeshMcpServer

describe('serveHttpOnFreePort', () => {
  test('auto-increments past an occupied port', async () => {
    const occupied = await occupyPort()
    try {
      const handle = await serveHttpOnFreePort(stubServer, {
        port: occupied.port,
        token: 'tok',
      })
      try {
        expect(handle.port).toBeGreaterThan(occupied.port)
      } finally {
        await handle.close()
      }
    } finally {
      await occupied.close()
    }
  })

  test('binds the requested port when free', async () => {
    // Grab a free port, release it, then ask serveHttpOnFreePort for it.
    const probe = await occupyPort()
    const wanted = probe.port
    await probe.close()
    const handle = await serveHttpOnFreePort(stubServer, { port: wanted, token: 'tok' })
    try {
      expect(handle.port).toBe(wanted)
    } finally {
      await handle.close()
    }
  })
})
