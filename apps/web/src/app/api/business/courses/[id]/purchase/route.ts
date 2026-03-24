import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import { SubscriptionService } from '@/features/business-panel/services/subscription.service'
import { SessionService } from '@/features/auth/services/session.service'

/**
 * POST /api/business/courses/[id]/purchase
 * Adquiere un curso a nivel de organización
 * Requiere membresía activa y verifica límite de 10 cursos por período de facturación
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    const { id: courseId } = await params
    const supabase = await createClient()

    // Obtener usuario autenticado
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado'
      }, { status: 401 })
    }

    // Obtener organizationId
    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'No tienes una organización asignada'
      }, { status: 403 })
    }

    const organizationId = auth.organizationId

    // Validar que la organización tenga membresía activa
    const hasSubscription = await SubscriptionService.hasActiveSubscription(currentUser.id, organizationId)
    if (!hasSubscription) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere una membresía activa (Team/Enterprise) para adquirir cursos'
      }, { status: 403 })
    }

    // Obtener el curso
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, price, slug')
      .eq('id', courseId)
      .eq('is_active', true)
      .single()

    if (courseError || !course) {
      logger.error('Error fetching course:', courseError)
      return NextResponse.json({
        success: false,
        error: 'Curso no encontrado'
      }, { status: 404 })
    }

    // Verificar si la organización ya compró este curso
    const { data: existingOrgPurchase } = await supabase
      .from('organization_course_purchases')
      .select('purchase_id, access_status')
      .eq('organization_id', organizationId)
      .eq('course_id', course.id)
      .eq('access_status', 'active')
      .maybeSingle()

    if (existingOrgPurchase) {
      return NextResponse.json({
        success: false,
        error: 'Tu organización ya tiene acceso a este curso'
      }, { status: 400 })
    }

    // Obtener información de la organización para calcular período de facturación
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('subscription_start_date, billing_cycle')
      .eq('id', organizationId)
      .single()

    if (orgError || !organization) {
      logger.error('Error fetching organization:', orgError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener información de la organización'
      }, { status: 500 })
    }

    // Verificar límite de cursos por período de facturación
    const limitCheck = await SubscriptionService.canOrganizationPurchaseCourse(organizationId, 10)
    
    // Determinar precio: gratis si cumple requisitos, precio del curso si no
    let finalPriceCents = Math.round((course.price || 0) * 100)
    let isFree = false

    if (limitCheck.canPurchase && limitCheck.billingPeriod) {
      // Cumple requisitos: precio gratis
      finalPriceCents = 0
      isFree = true
    }

    // Calcular campos de billing para la tabla (usar mes calendario para rastreo)
    const now = new Date()
    const billingMonth = new Date(now.getFullYear(), now.getMonth(), 1) // Primer día del mes calendario
    const billingYear = now.getFullYear()
    const billingMonthNumber = now.getMonth() + 1

    // Crear transacción solo si el precio no es gratis
    let transactionId: string | null = null
    let paymentMethodId: string | null = null

    if (finalPriceCents > 0) {
      // Crear o obtener método de pago temporal
      const { data: existingPaymentMethod } = await supabase
        .from('payment_methods')
        .select('payment_method_id')
        .eq('user_id', currentUser.id)
        .eq('payment_method_type', 'bank_transfer')
        .like('payment_method_name', '%Temporal%')
        .maybeSingle()

      if (existingPaymentMethod) {
        paymentMethodId = existingPaymentMethod.payment_method_id
      } else {
        const { data: tempPaymentMethod, error: paymentMethodError } = await supabase
          .from('payment_methods')
          .insert({
            user_id: currentUser.id,
            payment_method_type: 'bank_transfer',
            payment_method_name: 'Pago Temporal (Business Panel)',
            encrypted_data: {
              temporary: true,
              created_for: 'business_panel_course_purchase',
              note: 'Método temporal para compras desde Business Panel',
              created_at: new Date().toISOString()
            },
            is_active: true,
            is_default: false
          })
          .select()
          .single()

        if (paymentMethodError || !tempPaymentMethod) {
          logger.error('Error creando método de pago temporal:', paymentMethodError)
          return NextResponse.json({
            success: false,
            error: 'Error al crear método de pago'
          }, { status: 500 })
        }
        paymentMethodId = tempPaymentMethod.payment_method_id
      }

      // Crear transacción
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: currentUser.id,
          course_id: course.id,
          payment_method_id: paymentMethodId,
          amount_cents: finalPriceCents,
          currency: 'USD',
          transaction_status: 'completed',
          transaction_type: 'course_purchase',
          processed_at: new Date().toISOString(),
          processor_response: {
            business_panel_purchase: true,
            organization_purchase: true,
            is_free: isFree
          }
        })
        .select()
        .single()

      if (transactionError || !transaction) {
        logger.error('Error creating transaction:', transactionError)
        return NextResponse.json({
          success: false,
          error: 'Error al crear la transacción'
        }, { status: 500 })
      }

      transactionId = transaction.transaction_id
    }

    // Crear registro en organization_course_purchases
    const { data: orgPurchase, error: purchaseError } = await supabase
      .from('organization_course_purchases')
      .insert({
        organization_id: organizationId,
        course_id: course.id,
        purchased_by: currentUser.id,
        transaction_id: transactionId,
        payment_method_id: paymentMethodId,
        original_price_cents: Math.round((course.price || 0) * 100),
        discounted_price_cents: finalPriceCents,
        final_price_cents: finalPriceCents,
        currency: 'USD',
        access_status: 'active',
        purchase_method: isFree ? 'subscription_benefit' : 'direct_purchase',
        purchase_notes: isFree 
          ? 'Compra gratuita - Beneficio de suscripción (dentro del límite mensual)'
          : 'Compra desde Business Panel',
        billing_month: billingMonth.toISOString().split('T')[0],
        billing_year: billingYear,
        billing_month_number: billingMonthNumber,
        metadata: {
          business_panel: true,
          subscription_required: true,
          is_free: isFree,
          current_count: limitCheck.currentCount,
          max_courses: limitCheck.maxCourses,
          billing_period_start: limitCheck.billingPeriod?.start.toISOString(),
          billing_period_end: limitCheck.billingPeriod?.end.toISOString(),
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (purchaseError || !orgPurchase) {
      logger.error('Error creating organization purchase:', purchaseError)
      // Intentar eliminar la transacción creada si existe
      if (transactionId) {
        await supabase.from('transactions').delete().eq('transaction_id', transactionId)
      }
      
      return NextResponse.json({
        success: false,
        error: 'Error al crear la compra organizacional'
      }, { status: 500 })
    }

    logger.info('✅ Organization course purchase created:', {
      organizationId,
      courseId: course.id,
      purchaseId: orgPurchase.purchase_id,
      isFree,
      currentCount: limitCheck.currentCount
    })

    // Retornar respuesta exitosa
    return NextResponse.json({
      success: true,
      message: isFree 
        ? 'Curso adquirido exitosamente (gratis - beneficio de suscripción)'
        : 'Curso adquirido exitosamente',
      data: {
        purchase_id: orgPurchase.purchase_id,
        transaction_id: transactionId,
        course_id: course.id,
        course_title: course.title,
        price_paid: finalPriceCents,
        currency: 'USD',
        access_status: 'active',
        is_free: isFree,
        current_monthly_count: limitCheck.currentCount + 1,
        max_courses_per_period: limitCheck.maxCourses
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/courses/[id]/purchase:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

