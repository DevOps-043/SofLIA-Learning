import { buildInteractiveActivitySection } from './activity-focus'
import { buildLessonContextSection } from './lesson-context'
import { buildSystemEventsSection } from './system-events'
import { buildTeamDetailSection } from './team-detail'
import type { PlatformContext } from './types'
import { buildUniversalUserRoleSection } from './user-role'

export function buildPageInstructionsSection(context: PlatformContext): string {
  let section = ''

  if (context.userJobTitle || context.currentLessonContext || context.currentActivityContext) {
    section += buildUniversalUserRoleSection(context, context.currentLessonContext)
  }

  section += buildTeamDetailSection(context)
  section += buildInteractiveActivitySection(context)
  section += buildLessonContextSection(context)
  section += buildSystemEventsSection()

  return section
}
