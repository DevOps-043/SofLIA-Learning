import { createBusinessUsersAdminClient } from '@/features/business-panel/services/business-users-server/client'
import { logQueryError } from './log-query-error'

/**
 * Cliente service-role para leer las tablas de diálogo (`soflia_dialogue_*`), que
 * son `service_role only` por RLS. La analítica del propio business-user usa un
 * cliente con sesión (sin acceso a esas tablas), así que las lecturas de diálogo se
 * elevan SIEMPRE por aquí, manteniendo el filtrado estricto por `user_id` + scope.
 *
 * Devuelve `null` si el service role no está configurado, para degradar de forma
 * suave (analytics sin métricas de diálogo) en lugar de tirar todo el dataset.
 */
export function resolveDialogueServiceClient(): unknown | null {
  try {
    return createBusinessUsersAdminClient()
  } catch (error) {
    logQueryError('dialogue service client unavailable', error)
    return null
  }
}
