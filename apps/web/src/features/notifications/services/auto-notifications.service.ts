export { CertificateNotificationsService } from './auto-notifications-certificates.service'
export { CommunityNotificationsService } from './auto-notifications-community.service'
export { ContentNotificationsService } from './auto-notifications-content.service'
export { CourseNotificationsService } from './auto-notifications-courses.service'
export { LearningPathNotificationsService } from './auto-notifications-learning-paths.service'
export { OrganizationNotificationsService } from './auto-notifications-org.service'
export { SystemNotificationsService } from './auto-notifications-system.service'

import { certificateNotificationFacade } from './auto-notifications-facade/certificate.facade'
import { communityNotificationFacade } from './auto-notifications-facade/community.facade'
import { contentNotificationFacade } from './auto-notifications-facade/content.facade'
import { courseNotificationFacade } from './auto-notifications-facade/course.facade'
import { learningPathNotificationFacade } from './auto-notifications-facade/learning-path.facade'
import { organizationNotificationFacade } from './auto-notifications-facade/organization.facade'
import { systemNotificationFacade } from './auto-notifications-facade/system.facade'

export const AutoNotificationsService = {
  ...systemNotificationFacade,
  ...communityNotificationFacade,
  ...courseNotificationFacade,
  ...contentNotificationFacade,
  ...organizationNotificationFacade,
  ...learningPathNotificationFacade,
  ...certificateNotificationFacade,
}
