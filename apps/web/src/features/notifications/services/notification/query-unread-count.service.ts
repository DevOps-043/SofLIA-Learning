import { logger } from '../../../../lib/logger'
import { getServerClient } from '../auto-notifications-server-client'
import { buildNotificationsActiveFilter } from './utils'

async function getUnreadCountFallback(userId: string) {
  const supabase = await getServerClient()
  const activeFilter = buildNotificationsActiveFilter(new Date().toISOString())
  const [totalResult, criticalResult, highResult] = await Promise.all([
    supabase
      .from('user_notifications')
      .select('notification_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'unread')
      .or(activeFilter),
    supabase
      .from('user_notifications')
      .select('notification_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'unread')
      .eq('priority', 'critical')
      .or(activeFilter),
    supabase
      .from('user_notifications')
      .select('notification_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'unread')
      .eq('priority', 'high')
      .or(activeFilter),
  ])

  if (totalResult.error || criticalResult.error || highResult.error) {
    logger.error('Error en fallback count:', {
      totalError: totalResult.error,
      criticalError: criticalResult.error,
      highError: highResult.error,
    })
  }

  return {
    total: totalResult.count || 0,
    critical: criticalResult.count || 0,
    high: highResult.count || 0,
  }
}

interface UnreadCountsRow {
  total: number | string | null
  critical: number | string | null
  high: number | string | null
}

// La RPC es nueva y aún no figura en los tipos generados (lib/supabase/types).
// Se accede con un contrato mínimo local, como el resto de RPC del repo fuera
// del tipo Database. Al regenerar los tipos se puede tipar de forma nativa.
type UnreadCountsRpcClient = {
  rpc(
    fn: 'get_unread_notification_counts',
    params: { p_user_id: string },
  ): Promise<{ data: UnreadCountsRow[] | UnreadCountsRow | null; error: { message: string } | null }>
}

/**
 * Camino principal: una sola consulta vía RPC con agregación condicional.
 * El badge de notificaciones se consulta por polling desde cada usuario
 * conectado; resolver los tres conteos en un viaje (en vez de tres COUNT
 * separados) reduce a un tercio la carga de esta ruta caliente.
 */
export async function getUnreadCount(userId: string) {
  try {
    const supabase = await getServerClient()
    const { data, error } = await (
      supabase as unknown as UnreadCountsRpcClient
    ).rpc('get_unread_notification_counts', { p_user_id: userId })

    if (error) {
      // La RPC puede no existir en un entorno aún no migrado: se degrada al
      // conteo por consultas separadas en lugar de romper el header.
      logger.warn('RPC get_unread_notification_counts no disponible, usando fallback', {
        error: error.message,
      })
      return await getUnreadCountFallback(userId)
    }

    const row = (Array.isArray(data) ? data[0] : data) as UnreadCountsRow | null
    return {
      total: Number(row?.total ?? 0),
      critical: Number(row?.critical ?? 0),
      high: Number(row?.high ?? 0),
    }
  } catch (error) {
    logger.error('Error en getUnreadCount:', error)
    return { total: 0, critical: 0, high: 0 }
  }
}
