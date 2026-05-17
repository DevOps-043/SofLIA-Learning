import type { NextRequest } from 'next/server'

function getTrustedAgentBootstrapKey() {
  return process.env.SOFLIA_TRUSTED_AGENT_BOOTSTRAP_KEY || ''
}

export function validateTrustedAgentBootstrap(request: NextRequest) {
  const bootstrapKey = getTrustedAgentBootstrapKey()
  const providedBootstrap = request.headers
    .get('x-soflia-agent-bootstrap')
    ?.trim()

  if (!bootstrapKey) {
    return process.env.NODE_ENV !== 'production'
  }

  return providedBootstrap === bootstrapKey
}
