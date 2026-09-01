import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createAdminClientMock, requireBusinessMock } = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  requireBusinessMock: vi.fn(),
}))

vi.mock('@/lib/auth/requireBusiness', () => ({
  requireBusiness: requireBusinessMock,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock('@/features/business-panel/services/subscription.service', () => ({
  SubscriptionService: {
    calculateBillingPeriod: vi.fn(() => ({
      end: new Date('2026-10-01T00:00:00.000Z'),
      start: new Date('2026-09-01T00:00:00.000Z'),
    })),
  },
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}))

import { handleOrganizationCoursePurchase } from '../purchase-handler'

function createPurchaseClient(
  options: {
    purchaseError?: { code: string; message: string } | null
  } = {},
) {
  const insertedPayloads: Array<Record<string, unknown>> = []
  let purchaseReadCount = 0

  const client = {
    from: vi.fn((table: string) => {
      if (table === 'courses') {
        const query = {
          eq: vi.fn(() => query),
          single: vi.fn(async () => ({
            data: {
              id: 'course-1',
              price: 25,
              slug: 'course-1',
              title: 'Course',
            },
            error: null,
          })),
        }
        return { select: vi.fn(() => query) }
      }

      if (table === 'organizations') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: {
                  billing_cycle: 'monthly',
                  id: 'org-1',
                  is_active: true,
                  subscription_end_date: null,
                  subscription_plan: 'business',
                  subscription_start_date: '2026-01-01T00:00:00.000Z',
                  subscription_status: 'active',
                },
                error: null,
              })),
            })),
          })),
        }
      }

      if (table === 'organization_course_purchases') {
        purchaseReadCount += 1
        if (purchaseReadCount === 1) {
          const existingQuery = {
            eq: vi.fn(() => existingQuery),
            maybeSingle: vi.fn(async () => ({ data: null, error: null })),
          }
          return { select: vi.fn(() => existingQuery) }
        }
        if (purchaseReadCount === 2) {
          const countQuery = {
            eq: vi.fn(() => countQuery),
            gte: vi.fn(() => countQuery),
            lt: vi.fn(async () => ({ count: 0, error: null })),
          }
          return { select: vi.fn(() => countQuery) }
        }

        return {
          insert: vi.fn((payload: Record<string, unknown>) => {
            insertedPayloads.push(payload)
            return {
              select: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: options.purchaseError
                    ? null
                    : { purchase_id: 'purchase-1' },
                  error: options.purchaseError ?? null,
                })),
              })),
            }
          }),
        }
      }

      throw new Error(`Unexpected table: ${table}`)
    }),
  }

  return { client, insertedPayloads }
}

describe('organization course purchase security', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects non-admin members before creating a service client', async () => {
    requireBusinessMock.mockResolvedValue({
      isOrgAdmin: false,
      organizationId: 'org-1',
      userId: 'member-1',
    })

    const response = await handleOrganizationCoursePurchase({
      courseId: 'course-1',
    })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toMatchObject({
      code: 'COURSE_PURCHASE_FORBIDDEN',
      success: false,
    })
    expect(createAdminClientMock).not.toHaveBeenCalled()
  })

  it('creates only a subscription-benefit purchase after authorization', async () => {
    requireBusinessMock.mockResolvedValue({
      isOrgAdmin: true,
      organizationId: 'org-1',
      userId: 'admin-1',
    })
    const { client, insertedPayloads } = createPurchaseClient()
    createAdminClientMock.mockReturnValue(client)

    const response = await handleOrganizationCoursePurchase({
      courseId: 'course-1',
    })

    expect(response.status).toBe(200)
    expect(insertedPayloads).toHaveLength(1)
    expect(insertedPayloads[0]).toMatchObject({
      organization_id: 'org-1',
      payment_method_id: null,
      purchase_method: 'subscription_benefit',
      purchased_by: 'admin-1',
      transaction_id: null,
    })
  })

  it('maps the database concurrency guard to an idempotent conflict', async () => {
    requireBusinessMock.mockResolvedValue({
      isOrgAdmin: true,
      organizationId: 'org-1',
      userId: 'admin-1',
    })
    const { client } = createPurchaseClient({
      purchaseError: {
        code: '23505',
        message: 'organization_course_already_active',
      },
    })
    createAdminClientMock.mockReturnValue(client)

    const response = await handleOrganizationCoursePurchase({
      courseId: 'course-1',
    })

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({
      code: 'COURSE_ALREADY_PURCHASED',
      success: false,
    })
  })
})
