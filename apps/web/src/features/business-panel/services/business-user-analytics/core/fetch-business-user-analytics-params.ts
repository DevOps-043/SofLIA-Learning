import type { BusinessUserAnalyticsRange } from '../../../types/business-user-analytics.types'
import { BusinessUserAnalyticsSupabaseClient } from './business-user-analytics-supabase-client'

export interface FetchBusinessUserAnalyticsParams {
  supabase: BusinessUserAnalyticsSupabaseClient
  userId: string
  organizationId: string
  range: BusinessUserAnalyticsRange
  /**
   * Cuando es `true` (vista de superadmin), incluye TODA la actividad del usuario
   * sin acotarla a la organización resuelta. Necesario porque un usuario puede
   * pertenecer a varias organizaciones y tener enrollments personales
   * (`organization_id = null`); acotar a una sola org subcontaría sus entregas.
   * La vista del propio business-user lo deja en `false` (scope por su org).
   */
  includeAllUserEnrollments?: boolean
}
