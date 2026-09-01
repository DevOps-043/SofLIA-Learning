import { NextResponse } from 'next/server'

import { SubscriptionService } from '@/features/business-panel/services/subscription.service'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

const MAX_INCLUDED_COURSES_PER_PERIOD = 10
const ACTIVE_SUBSCRIPTION_PLANS = new Set(['team', 'business', 'enterprise'])
const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trial'])

function normalized(value: string | null): string {
  return value?.trim().toLowerCase() ?? ''
}

function isSubscriptionActive(organization: {
  is_active: boolean | null
  subscription_end_date: string | null
  subscription_plan: string | null
  subscription_status: string | null
}): boolean {
  if (!organization.is_active) return false
  if (
    !ACTIVE_SUBSCRIPTION_PLANS.has(normalized(organization.subscription_plan))
  )
    return false
  if (
    !ACTIVE_SUBSCRIPTION_STATUSES.has(
      normalized(organization.subscription_status),
    )
  )
    return false
  return (
    !organization.subscription_end_date ||
    new Date(organization.subscription_end_date).getTime() >= Date.now()
  )
}

export async function handleOrganizationCoursePurchase(input: {
  courseId: string
  organizationSlug?: string
}): Promise<NextResponse> {
  try {
    const auth = await requireBusiness(
      input.organizationSlug
        ? { organizationSlug: input.organizationSlug }
        : undefined,
    )
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId || !auth.isOrgAdmin) {
      return NextResponse.json(
        {
          success: false,
          code: 'COURSE_PURCHASE_FORBIDDEN',
          error:
            'No tienes permisos para adquirir cursos para esta organizacion',
        },
        { status: 403 },
      )
    }

    const organizationId = auth.organizationId
    const supabase = createAdminClient()
    const [
      { data: course, error: courseError },
      { data: organization, error: orgError },
    ] = await Promise.all([
      supabase
        .from('courses')
        .select('id, title, price, slug')
        .eq('id', input.courseId)
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .single(),
      supabase
        .from('organizations')
        .select(
          'id, is_active, subscription_plan, subscription_status, subscription_end_date, subscription_start_date, billing_cycle',
        )
        .eq('id', organizationId)
        .single(),
    ])

    if (courseError || !course) {
      return NextResponse.json(
        {
          success: false,
          code: 'COURSE_NOT_FOUND',
          error: 'Curso no encontrado',
        },
        { status: 404 },
      )
    }
    if (orgError || !organization || !isSubscriptionActive(organization)) {
      return NextResponse.json(
        {
          success: false,
          code: 'ACTIVE_SUBSCRIPTION_REQUIRED',
          error:
            'Se requiere una membresia activa (Team/Enterprise) para adquirir cursos',
        },
        { status: 403 },
      )
    }

    const billingPeriod = SubscriptionService.calculateBillingPeriod(
      organization.subscription_start_date,
      organization.billing_cycle as 'monthly' | 'yearly' | null,
    )
    if (!billingPeriod) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_BILLING_CONFIGURATION',
          error:
            'La configuracion de facturacion de la organizacion es invalida',
        },
        { status: 409 },
      )
    }

    const [{ data: existingPurchase }, purchaseCountResult] = await Promise.all(
      [
        supabase
          .from('organization_course_purchases')
          .select('purchase_id, access_status')
          .eq('organization_id', organizationId)
          .eq('course_id', course.id)
          .eq('access_status', 'active')
          .maybeSingle(),
        supabase
          .from('organization_course_purchases')
          .select('purchase_id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('access_status', 'active')
          .gte('purchased_at', billingPeriod.start.toISOString())
          .lt('purchased_at', billingPeriod.end.toISOString()),
      ],
    )

    if (existingPurchase) {
      return NextResponse.json(
        {
          success: false,
          code: 'COURSE_ALREADY_PURCHASED',
          error: 'Tu organizacion ya tiene acceso a este curso',
        },
        { status: 409 },
      )
    }
    if (purchaseCountResult.error) {
      throw new Error(
        `COURSE_PURCHASE_COUNT_FAILED:${purchaseCountResult.error.message}`,
      )
    }

    const currentCount = purchaseCountResult.count ?? 0
    if (currentCount >= MAX_INCLUDED_COURSES_PER_PERIOD) {
      // This endpoint has no real payment-provider checkout. Never synthesize a
      // completed transaction to bypass the subscription benefit limit.
      return NextResponse.json(
        {
          success: false,
          code: 'COURSE_PURCHASE_LIMIT_REACHED',
          error: 'Se alcanzo el limite de cursos incluidos en este periodo',
        },
        { status: 409 },
      )
    }

    const originalPriceCents = Math.round((course.price || 0) * 100)
    const { data: purchase, error: purchaseError } = await supabase
      .from('organization_course_purchases')
      .insert({
        access_status: 'active',
        billing_month: billingPeriod.start.toISOString().slice(0, 10),
        billing_month_number: billingPeriod.start.getUTCMonth() + 1,
        billing_year: billingPeriod.start.getUTCFullYear(),
        course_id: course.id,
        currency: 'USD',
        discounted_price_cents: 0,
        final_price_cents: 0,
        metadata: {
          billing_period_end: billingPeriod.end.toISOString(),
          billing_period_start: billingPeriod.start.toISOString(),
          business_panel: true,
          current_count: currentCount,
          is_free: true,
          max_courses: MAX_INCLUDED_COURSES_PER_PERIOD,
          subscription_required: true,
        },
        organization_id: organizationId,
        original_price_cents: originalPriceCents,
        payment_method_id: null,
        purchase_method: 'subscription_benefit',
        purchase_notes: 'Compra gratuita - Beneficio de suscripcion',
        purchased_by: auth.userId,
        transaction_id: null,
      })
      .select('purchase_id')
      .single()

    if (purchaseError || !purchase) {
      if (purchaseError?.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            code: 'COURSE_ALREADY_PURCHASED',
            error: 'Tu organizacion ya tiene acceso a este curso',
          },
          { status: 409 },
        )
      }
      if (
        purchaseError?.code === '23514' &&
        purchaseError.message.includes(
          'organization_course_period_limit_reached',
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            code: 'COURSE_PURCHASE_LIMIT_REACHED',
            error: 'Se alcanzo el limite de cursos incluidos en este periodo',
          },
          { status: 409 },
        )
      }
      logger.error(
        'Error creating organization course purchase',
        purchaseError,
        {
          courseId: course.id,
          organizationId,
        },
      )
      return NextResponse.json(
        {
          success: false,
          code: 'COURSE_PURCHASE_CREATE_FAILED',
          error: 'Error al crear la compra organizacional',
        },
        { status: 500 },
      )
    }

    logger.info('Organization course purchase created', {
      courseId: course.id,
      organizationId,
      purchaseId: purchase.purchase_id,
    })

    return NextResponse.json({
      success: true,
      message: 'Curso adquirido exitosamente (beneficio de suscripcion)',
      data: {
        access_status: 'active',
        course_id: course.id,
        course_title: course.title,
        currency: 'USD',
        current_monthly_count: currentCount + 1,
        is_free: true,
        max_courses_per_period: MAX_INCLUDED_COURSES_PER_PERIOD,
        price_paid: 0,
        purchase_id: purchase.purchase_id,
        transaction_id: null,
      },
    })
  } catch (error) {
    logger.error('Error in organization course purchase', error)
    return NextResponse.json(
      {
        success: false,
        code: 'COURSE_PURCHASE_INTERNAL_ERROR',
        error: 'Error interno del servidor',
      },
      { status: 500 },
    )
  }
}
