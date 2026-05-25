export interface TrustedAgentValidation {
  trusted: boolean
  agentId?: string
  reasons: string[]
}

export interface TrustedAgentCookiePayload {
  agentId: string
  userAgentHash: string
  exp: number
}
