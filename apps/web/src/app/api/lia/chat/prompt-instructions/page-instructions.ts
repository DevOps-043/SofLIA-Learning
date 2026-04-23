import type { PlatformContext } from '../platform-context.service'
import { buildActivityContextSection } from './activity-section'
import { buildLessonContextSection } from './lesson-section'
import { buildSystemEventsSection } from './system-events'
import { buildTeamDetailSection } from './team-detail'
import { buildUniversalUserRoleSection } from './user-role'

export function buildPageInstructionsSection(context: PlatformContext): string {
  let section = ''

  if (context.userJobTitle || context.currentLessonContext || context.currentActivityContext) {
    section += buildUniversalUserRoleSection(context, context.currentLessonContext)
  }

  section += buildTeamDetailSection(context)
  section += buildActivityContextSection(context)
  section += buildLessonContextSection(context)
  section += buildSystemEventsSection()

  return section
}
