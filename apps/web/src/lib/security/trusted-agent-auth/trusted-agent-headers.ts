import { timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'
import {
  getAllowedAgentIds,
  TRUSTED_AGENT_MAX_AGE_MS,
} from './trusted-agent-settings'
import { signTrustedAgentRequest } from './trusted-agent-signature'
import type { TrustedAgentValidation } from './trusted-agent.types'

function hasNoTrustedAgentHeaders(input: {
  agentId?: string
  signature?: string
  timestamp?: string
}) {
  return !input.agentId && !input.timestamp && !input.signature
}

export function validateTrustedAgentHeaders(
  request: NextRequest,
): TrustedAgentValidation {
  const agentId = request.headers.get('x-soflia-agent-id')?.trim()
  const timestamp = request.headers.get('x-soflia-agent-ts')?.trim()
  const signature = request.headers.get('x-soflia-agent-signature')?.trim()

  if (hasNoTrustedAgentHeaders({ agentId, timestamp, signature })) {
    return { trusted: false, reasons: [] }
  }

  const reasons: string[] = []

  if (!agentId || !timestamp || !signature) {
    reasons.push('missing required signed-agent headers')
    return { trusted: false, reasons }
  }

  if (!getAllowedAgentIds().includes(agentId)) {
    reasons.push('agent id is not allowlisted')
    return { trusted: false, agentId, reasons }
  }

  const timestampValue = Number(timestamp)
  if (!Number.isFinite(timestampValue)) {
    reasons.push('invalid signed-agent timestamp')
    return { trusted: false, agentId, reasons }
  }

  if (Math.abs(Date.now() - timestampValue) > TRUSTED_AGENT_MAX_AGE_MS) {
    reasons.push('signed-agent timestamp expired')
    return { trusted: false, agentId, reasons }
  }

  const expectedSignature = signTrustedAgentRequest({
    agentId,
    timestamp,
    method: request.method,
    pathname: request.nextUrl.pathname,
  })

  if (expectedSignature.length !== signature.length) {
    reasons.push('signed-agent signature length mismatch')
    return { trusted: false, agentId, reasons }
  }

  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    reasons.push('signed-agent signature mismatch')
    return { trusted: false, agentId, reasons }
  }

  return {
    trusted: true,
    agentId,
    reasons: ['valid signed first-party agent request'],
  }
}
