import type { Server } from 'http'
import type { Socket } from 'net'
import type { IncomingMessage } from 'http'
import WebSocket, { WebSocketServer } from 'ws'

import { config } from '@/config/env'
import { logger } from '@/core/logging/logger'
import { validateRequestOrigin } from '@/middleware/secure-cors.origins'
import {
  SOFLIA_LIVE_SYSTEM_INSTRUCTION,
  buildGeminiLiveWebSocketUrl,
  getGeminiLiveModel,
} from './lia-live.config'

type ClientLiveMessage =
  | { type: 'audio'; data: string; mimeType?: string }
  | { type: 'text'; text: string }
  | { type: 'stop' }

function rejectUpgrade(socket: Socket, statusCode: number, reason: string) {
  socket.write(`HTTP/1.1 ${statusCode} ${reason}\r\n\r\n`)
  socket.destroy()
}

function isLiveUpgrade(request: IncomingMessage, apiVersion: string) {
  const url = new URL(request.url || '/', 'http://localhost')
  return url.pathname === `/api/${apiVersion}/lia/live`
}

function safeSend(socket: WebSocket, payload: string | Buffer) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(payload)
  }
}

function buildSetupMessage() {
  const model = getGeminiLiveModel()

  return {
    setup: {
      model: model.startsWith('models/') ? model : `models/${model}`,
      generationConfig: {
        responseModalities: ['AUDIO'],
      },
      systemInstruction: {
        parts: [{ text: SOFLIA_LIVE_SYSTEM_INSTRUCTION }],
      },
    },
  }
}

function toGeminiMessage(message: ClientLiveMessage) {
  if (message.type === 'text') {
    return {
      clientContent: {
        turns: [
          {
            role: 'user',
            parts: [{ text: message.text }],
          },
        ],
        turnComplete: true,
      },
    }
  }

  if (message.type === 'audio') {
    return {
      realtimeInput: {
        mediaChunks: [
          {
            mimeType: message.mimeType || 'audio/webm;codecs=opus',
            data: message.data,
          },
        ],
      },
    }
  }

  return {
    realtimeInput: {
      activityEnd: {},
    },
  }
}

function parseClientMessage(data: WebSocket.RawData): ClientLiveMessage | null {
  try {
    const text = Buffer.isBuffer(data) ? data.toString('utf8') : data.toString()
    const parsed = JSON.parse(text) as Partial<ClientLiveMessage>

    if (parsed.type === 'text' && typeof parsed.text === 'string' && parsed.text.trim()) {
      return { type: 'text', text: parsed.text.trim() }
    }

    if (parsed.type === 'audio' && typeof parsed.data === 'string' && parsed.data) {
      return {
        type: 'audio',
        data: parsed.data,
        mimeType: typeof parsed.mimeType === 'string' ? parsed.mimeType : undefined,
      }
    }

    if (parsed.type === 'stop') {
      return { type: 'stop' }
    }

    return null
  } catch {
    return null
  }
}

export function attachLiaLiveWebSocket(server: Server, apiVersion = config.API_VERSION || 'v1') {
  const wss = new WebSocketServer({ noServer: true })

  server.on('upgrade', (request, socket, head) => {
    if (!isLiveUpgrade(request, apiVersion)) {
      return
    }

    try {
      validateRequestOrigin(request.headers.origin)
    } catch {
      rejectUpgrade(socket, 403, 'Forbidden')
      return
    }

    const upstreamUrl = buildGeminiLiveWebSocketUrl()
    if (!upstreamUrl) {
      rejectUpgrade(socket, 503, 'Service Unavailable')
      return
    }

    wss.handleUpgrade(request, socket, head, (client) => {
      wss.emit('connection', client, request, upstreamUrl)
    })
  })

  wss.on('connection', (client: WebSocket, _request: IncomingMessage, upstreamUrl: string) => {
    const upstream = new WebSocket(upstreamUrl)

    upstream.on('open', () => {
      safeSend(upstream, JSON.stringify(buildSetupMessage()))
      safeSend(client, JSON.stringify({
        type: 'ready',
        model: getGeminiLiveModel(),
      }))
    })

    upstream.on('message', (data) => {
      if (Buffer.isBuffer(data)) {
        safeSend(client, data)
        return
      }

      safeSend(client, data.toString())
    })

    upstream.on('error', (error) => {
      logger.error('Gemini Live upstream error', error)
      safeSend(client, JSON.stringify({
        type: 'error',
        code: 'GEMINI_LIVE_UPSTREAM_ERROR',
      }))
      client.close(1011, 'Gemini Live upstream error')
    })

    upstream.on('close', (code, reason) => {
      if (client.readyState === WebSocket.OPEN) {
        client.close(code, reason)
      }
    })

    client.on('message', (data) => {
      const parsed = parseClientMessage(data)
      if (!parsed) {
        return
      }

      const upstreamMessage = toGeminiMessage(parsed)
      safeSend(upstream, JSON.stringify(upstreamMessage))
    })

    client.on('close', () => {
      if (upstream.readyState === WebSocket.OPEN || upstream.readyState === WebSocket.CONNECTING) {
        upstream.close()
      }
    })

    client.on('error', () => {
      if (upstream.readyState === WebSocket.OPEN || upstream.readyState === WebSocket.CONNECTING) {
        upstream.close()
      }
    })
  })

  logger.info('SofLIA Live WebSocket proxy configured', {
    path: `/api/${apiVersion}/lia/live`,
    model: getGeminiLiveModel(),
  })
}
