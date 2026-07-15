import type { CourseLessonContext } from '@/core/types/lia.types'
import { SofLIAPersonalizationService } from '@/core/services/lia-personalization.service'
import type { ResolvedOrganizationAiContext } from '@/lib/lia-context/services/organization-ai-context.service'
import { logger } from '@/lib/utils/logger'
import { getContextPrompt, type PageContext } from '../system-prompt.service'
import type { SupportedLanguage } from './language-detection.service'

interface AuthenticatedUser {
  id: string
}

interface BuildAiChatContextParams {
  user?: AuthenticatedUser | null
  message: string
  context: string
  language: SupportedLanguage
  displayName: string
  userRole?: string
  userRoleDescription?: string
  organizationAiContext?: ResolvedOrganizationAiContext | null
  courseContext?: CourseLessonContext
  workshopContext?: CourseLessonContext
  pageContext?: PageContext
  isFirstMessage: boolean
  isPromptMode: boolean
  requestOrigin: string
}

export interface BuildAiChatContextResult {
  effectiveContext: string
  effectiveLanguage: SupportedLanguage
  contextPrompt: string
}

async function buildPersonalizationPrompt(userId: string) {
  try {
    const settings = await SofLIAPersonalizationService.getSettings(userId)

    if (!settings) {
      return ''
    }

    return SofLIAPersonalizationService.buildPersonalizationPrompt(settings)
  } catch (error) {
    logger.warn('Error cargando personalizacion de SofLIA:', error)
    return ''
  }
}

export async function buildAiChatContext({
  user,
  context,
  language,
  displayName,
  userRole,
  userRoleDescription,
  organizationAiContext,
  courseContext,
  workshopContext,
  pageContext,
  isFirstMessage,
  isPromptMode,
}: BuildAiChatContextParams): Promise<BuildAiChatContextResult> {
  const effectiveContext = isPromptMode ? 'prompts' : context
  const effectiveLanguage = language

  let contextPrompt = getContextPrompt(
    effectiveContext,
    displayName,
    courseContext,
    workshopContext,
    pageContext,
    userRole,
    effectiveLanguage,
    isFirstMessage,
    userRoleDescription,
    organizationAiContext,
  )

  if (user) {
    contextPrompt += await buildPersonalizationPrompt(user.id)
  }

  return {
    effectiveContext,
    effectiveLanguage,
    contextPrompt,
  }
}
