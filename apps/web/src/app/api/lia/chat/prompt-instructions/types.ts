import type { PlatformContext } from '../platform-context.service'

export type { PlatformContext }
export type LessonContext = NonNullable<PlatformContext['currentLessonContext']>
