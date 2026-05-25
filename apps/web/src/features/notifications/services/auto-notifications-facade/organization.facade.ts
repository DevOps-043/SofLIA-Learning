import { OrganizationNotificationsService } from '../auto-notifications-org.service'
import type { NotificationMetadata } from '../auto-notifications.shared'

export const organizationNotificationFacade = {
  notifyUserInvited(
    userId: string,
    organizationId: string,
    orgName: string,
    metadata?: NotificationMetadata,
  ) {
    return OrganizationNotificationsService.notifyUserInvited(userId, organizationId, orgName, metadata)
  },
  notifyRoleUpdated(
    userId: string,
    organizationId: string,
    newRole: string,
    metadata?: NotificationMetadata,
  ) {
    return OrganizationNotificationsService.notifyRoleUpdated(userId, organizationId, newRole, metadata)
  },
  notifyTeamAssignment(
    userId: string,
    organizationId: string,
    teamName: string,
    metadata?: NotificationMetadata,
  ) {
    return OrganizationNotificationsService.notifyTeamAssignment(userId, organizationId, teamName, metadata)
  },
}
