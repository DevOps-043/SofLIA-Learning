import { describe, expect, it } from 'vitest'

import {
  DEFAULT_LIA_MODEL,
  resolveLiaMessageCost,
  resolveLiaMessageModel,
  resolveLiaMessageTokens,
} from '../message-metrics'

describe('lia analytics message metrics', () => {
  it('uses stored metrics when available', () => {
    const message = {
      content: 'ignored content',
      cost_usd: 0.123456,
      model_used: 'gemini-3.1-flash-lite',
      role: 'assistant',
      tokens_used: 42,
    }

    expect(resolveLiaMessageModel(message)).toBe('gemini-3.1-flash-lite')
    expect(resolveLiaMessageTokens(message)).toBe(42)
    expect(resolveLiaMessageCost(message)).toBe(0.123456)
  })

  it('estimates missing legacy usage from content and role', () => {
    const message = {
      content: '123456789',
      cost_usd: null,
      model_used: null,
      role: 'user',
      tokens_used: null,
    }

    expect(resolveLiaMessageModel(message)).toBe(DEFAULT_LIA_MODEL)
    expect(resolveLiaMessageTokens(message)).toBe(3)
    expect(resolveLiaMessageCost(message)).toBeGreaterThan(0)
  })
})
