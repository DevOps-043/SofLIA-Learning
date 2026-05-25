import { vi } from 'vitest'

import type {
  InvitationEmailService,
  InvitationLogger,
  InvitationRepository,
  InvitationRuntime,
} from '../types'

export function createInvitationRepositoryMock(
  overrides: Partial<InvitationRepository> = {}
): InvitationRepository {
  return {
    addOrganizationMembership: vi.fn(async () => undefined),
    acceptInvitation: vi.fn(async () => undefined),
    createBulkInviteRegistration: vi.fn(async () => undefined),
    deleteOrganizationMembership: vi.fn(async () => undefined),
    createInvitation: vi.fn(async () => ({ id: 'inv-1' })),
    findOrganizationMembership: vi.fn(async () => null),
    findPendingInvitationByEmail: vi.fn(async () => null),
    findUserByEmail: vi.fn(async () => null),
    findUserById: vi.fn(async () => ({ cargoRol: null, id: 'user-1' })),
    getBulkInviteLinkByToken: vi.fn(async () => null),
    getInvitationById: vi.fn(async () => null),
    getInvitationByToken: vi.fn(async () => null),
    getInvitationForConsume: vi.fn(async () => null),
    getOrganizationById: vi.fn(async () => null),
    getOrganizationSlug: vi.fn(async () => null),
    listOrganizationInvitations: vi.fn(async () => []),
    markBulkInviteLinkStatus: vi.fn(async () => undefined),
    markInvitationExpired: vi.fn(async () => undefined),
    refreshInvitation: vi.fn(async () => undefined),
    reserveBulkInviteUse: vi.fn(async () => true),
    resolveAuthenticatedUserId: vi.fn(async () => null),
    revokePendingInvitation: vi.fn(async () => undefined),
    setUserBusinessRole: vi.fn(async () => undefined),
    ...overrides,
  }
}

export function createInvitationRuntimeMock(
  overrides: Partial<InvitationRuntime> = {}
): InvitationRuntime {
  const logger: InvitationLogger = {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }

  const emailService: InvitationEmailService = {
    sendOrganizationInvitationEmail: vi.fn(async () => undefined),
  }

  return {
    createToken: () => 'a'.repeat(64),
    emailService,
    logger,
    now: () => new Date('2026-04-02T12:00:00.000Z'),
    repo: createInvitationRepositoryMock(),
    ...overrides,
  }
}
