export const TRUSTED_AGENT_MAX_AGE_MS = 5 * 60 * 1000
export const TRUSTED_AGENT_COOKIE_NAME = 'soflia_agent'

export function getAllowedAgentIds() {
  return (
    process.env.SOFLIA_TRUSTED_AGENT_IDS
    || 'desktop-agent,desktop-extension,soflia-extension,soflia-desktop,soflia-web'
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

export function isAllowedTrustedAgentId(agentId: string) {
  return getAllowedAgentIds().includes(agentId)
}
