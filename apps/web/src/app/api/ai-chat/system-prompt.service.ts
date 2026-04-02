import type { CourseLessonContext } from '../../../core/types/lia.types'
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
  studyPlannerContextString?: string
) => {
  const role = userRole || courseContext?.userRole || workshopContext?.userRole
  const nameGreeting = buildNameGreeting(userName)
  const roleInfo = buildRoleInfo(role)
  const pageInfo = buildPageInfo(pageContext)

  if (courseContext && context === 'course') {
    return buildCoursePrompt({
      nameGreeting,
      roleInfo,
      pageInfo,
      role,
      courseContext,
    })
  }

  const contexts = buildContextPrompts({
    language,
    nameGreeting,
    roleInfo,
    pageInfo,
    role,
    userName,
    workshopContext,
    studyPlannerContextString,
  })

  return contexts[context] || contexts.general
}
