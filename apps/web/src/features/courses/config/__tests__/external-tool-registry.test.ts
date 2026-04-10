import { describe, expect, it } from 'vitest'
import {
  externalToolRegistry,
  getExternalToolDefinition,
} from '../external-tool-registry'

describe('external-tool-registry', () => {
  it('exposes the supported tools with stable labels', () => {
    expect(Object.keys(externalToolRegistry)).toEqual([
      'chatgpt',
      'gemini',
      'notebooklm',
      'gamma',
      'atlas',
    ])
    expect(externalToolRegistry.chatgpt.label).toBe('ChatGPT')
    expect(externalToolRegistry.notebooklm.url).toContain('notebooklm')
  })

  it('returns null when the tool key is missing', () => {
    expect(getExternalToolDefinition(null)).toBeNull()
    expect(getExternalToolDefinition(undefined)).toBeNull()
  })
})
