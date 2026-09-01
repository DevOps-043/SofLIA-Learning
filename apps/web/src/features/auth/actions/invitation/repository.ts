import type { InvitationRepository } from './types'
import { resolveAuthenticatedUserId } from './repository/authenticated-user'
import { createBulkInviteRepositoryMethods } from './repository/bulk-invite'
import { createInvitationCreateMethods } from './repository/invitation-create'
import { createInvitationDetailMethods } from './repository/invitation-detail'
import { createInvitationListMethods } from './repository/invitation-list'
import { createInvitationStatusMethods } from './repository/invitation-status'
import { createMembershipMethods } from './repository/membership'
import { createOrganizationMethods } from './repository/organizations'
import { createUserMethods } from './repository/users'

export function createInvitationRepository(
  dataClient: unknown,
  authClient: unknown = dataClient,
): InvitationRepository {
  return {
    ...createBulkInviteRepositoryMethods(dataClient),
    ...createInvitationCreateMethods(dataClient),
    ...createInvitationDetailMethods(dataClient),
    ...createInvitationListMethods(dataClient),
    ...createInvitationStatusMethods(dataClient),
    ...createMembershipMethods(dataClient),
    ...createOrganizationMethods(dataClient),
    ...createUserMethods(dataClient),
    resolveAuthenticatedUserId: () =>
      resolveAuthenticatedUserId(authClient, dataClient),
  }
}
