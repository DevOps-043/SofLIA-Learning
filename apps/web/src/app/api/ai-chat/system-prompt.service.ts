import type { CourseLessonContext } from '../../../core/types/lia.types'
import {
  buildOrganizationAiContextPromptSection,
  type ResolvedOrganizationAiContext,
} from '@/lib/lia-context/services/organization-ai-context.service'
import { buildCoursePrompt } from './system-prompt.course'
import { buildContextPrompts } from './system-prompt.contexts'
import {
  buildNameGreeting,
  buildPageInfo,
  buildRoleInfo,
} from './system-prompt.shared'
import type { PageContext, SupportedLanguage } from './system-prompt.types'

export type { PageContext, SupportedLanguage } from './system-prompt.types'

export const getContextPrompt = (
  context: string,
  userName?: string,
  courseContext?: CourseLessonContext,
  workshopContext?: CourseLessonContext,
  pageContext?: PageContext,
  userRole?: string,
  language: SupportedLanguage = 'es',
  _isFirstMessage = false,
  studyPlannerContextString?: string,
  userRoleDescription?: string,
  organizationAiContext?: ResolvedOrganizationAiContext | null
) => {
  const role = userRole || courseContext?.userRole || workshopContext?.userRole
  const nameGreeting = buildNameGreeting(userName)
  const roleInfo = buildRoleInfo(role, userRoleDescription)
  const organizationInfo = buildOrganizationAiContextPromptSection(organizationAiContext)
  const pageInfo = buildPageInfo(pageContext)

  if (courseContext && context === 'course') {
    return buildCoursePrompt({
      nameGreeting,
      roleInfo,
      pageInfo,
      organizationInfo,
      role,
      courseContext,
    })
  }

  const contexts = buildContextPrompts({
    language,
    nameGreeting,
    roleInfo,
    organizationInfo,
    pageInfo,
    role,
    userName,
    workshopContext,
    studyPlannerContextString,
  })

  return contexts[context] || contexts.general
}
