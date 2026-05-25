import type { SofLIAPersonalizationSettingsInput } from '@/core/types/soflia-personalization.types'
import { logger } from '@/lib/utils/logger'

const DANGEROUS_CUSTOM_INSTRUCTION_PATTERNS = [
  /ignore\s+previous\s+instructions/gi,
  /disregard\s+all\s+prior\s+commands/gi,
  /act\s+as\s+a/gi,
  /jailbreak/gi,
  /forget\s+everything/gi,
  /new\s+instructions/gi,
  /override/gi,
  /system\s+prompt/gi,
  /you\s+are\s+now/gi,
  /pretend\s+to\s+be/gi,
  /roleplay\s+as/gi,
  /dan\s+mode/gi,
  /developer\s+mode/gi,
] as const

export function buildPersonalizationSettingsInput(
  body: Partial<SofLIAPersonalizationSettingsInput>,
): SofLIAPersonalizationSettingsInput {
  return {
    base_style: body.base_style,
    is_friendly: body.is_friendly,
    is_enthusiastic: body.is_enthusiastic,
    custom_instructions: body.custom_instructions || null,
    nickname: body.nickname || null,
    voice_enabled: body.voice_enabled,
    dictation_enabled: body.dictation_enabled,
  }
}

export function hasPersonalizationUpdateField(
  settingsInput: SofLIAPersonalizationSettingsInput,
): boolean {
  return Object.values(settingsInput).some((value) => value !== undefined)
}

export function sanitizeCustomInstructions(
  settingsInput: SofLIAPersonalizationSettingsInput,
  userId: string,
): SofLIAPersonalizationSettingsInput {
  if (!settingsInput.custom_instructions) {
    return settingsInput
  }

  let sanitized = settingsInput.custom_instructions
  for (const pattern of DANGEROUS_CUSTOM_INSTRUCTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[contenido bloqueado]')
  }

  if (sanitized !== settingsInput.custom_instructions) {
    logger.warn('Se detectÃ³ posible prompt injection en custom_instructions:', {
      userId,
      originalLength: settingsInput.custom_instructions.length,
    })
    return {
      ...settingsInput,
      custom_instructions: sanitized,
    }
  }

  return settingsInput
}
