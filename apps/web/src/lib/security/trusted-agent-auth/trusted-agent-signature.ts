import { createHmac } from 'node:crypto'
import { getSecuritySigningSecret } from '../signed-token'

export function buildTrustedAgentSignatureInput(params: {
  agentId: string
  timestamp: string
  method: string
  pathname: string
}) {
  const { agentId, timestamp, method, pathname } = params

  return `${agentId}:${timestamp}:${method.toUpperCase()}:${pathname}`
}

export function signTrustedAgentRequest(params: {
  agentId: string
  timestamp: string
  method: string
  pathname: string
}) {
  return createHmac('sha256', getSecuritySigningSecret())
    .update(buildTrustedAgentSignatureInput(params))
    .digest('base64url')
}

export function createTrustedAgentHeaders(params: {
  agentId: string
  pathname: string
  method: string
  timestamp?: string
}) {
  const timestamp = params.timestamp || String(Date.now())
  const signature = signTrustedAgentRequest({
    agentId: params.agentId,
    timestamp,
    method: params.method,
    pathname: params.pathname,
  })

  return {
    'x-soflia-agent-id': params.agentId,
    'x-soflia-agent-ts': timestamp,
    'x-soflia-agent-signature': signature,
  }
}
