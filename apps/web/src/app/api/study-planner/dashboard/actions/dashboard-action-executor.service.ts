import type {
  ActionRequest,
  ActionResponse,
} from './dashboard-action.types'
import { completeSessionAction } from './dashboard-action-complete.service'
import { createSessionAction } from './dashboard-action-create.service'
import { deleteSessionAction } from './dashboard-action-delete.service'
import type { DashboardActionSupabaseClient } from './dashboard-action-db.service'
import { moveSessionAction } from './dashboard-action-move.service'
import { rescheduleSessionsAction } from './dashboard-action-reschedule.service'
import { resizeSessionAction } from './dashboard-action-resize.service'
import { updateSessionAction } from './dashboard-action-update.service'

export async function executeDashboardAction(params: {
  body: Partial<ActionRequest> & { data?: unknown }
  planId: string
  supabase: DashboardActionSupabaseClient
  userId: string
}): Promise<
  | ({ ok: true; message: string; data?: Record<string, unknown> })
  | ({ ok: false; error: string; status: number })
> {
  switch (params.body.action) {
    case 'move_session':
      return moveSessionAction({
        data: (params.body.data || {}) as ActionRequest<'move_session'>['data'],
        planId: params.planId,
        supabase: params.supabase,
        userId: params.userId,
      })
    case 'delete_session':
      return deleteSessionAction({
        data: (params.body.data || {}) as ActionRequest<'delete_session'>['data'],
        supabase: params.supabase,
        userId: params.userId,
      })
    case 'resize_session':
      return resizeSessionAction({
        data: (params.body.data || {}) as ActionRequest<'resize_session'>['data'],
        supabase: params.supabase,
        userId: params.userId,
      })
    case 'create_session':
      return createSessionAction({
        data: (params.body.data || {}) as ActionRequest<'create_session'>['data'],
        planId: params.planId,
        supabase: params.supabase,
        userId: params.userId,
      })
    case 'update_session':
      return updateSessionAction({
        data: (params.body.data || {}) as ActionRequest<'update_session'>['data'],
        supabase: params.supabase,
        userId: params.userId,
      })
    case 'complete_session':
      return completeSessionAction({
        data: (params.body.data || {}) as ActionRequest<'complete_session'>['data'],
        supabase: params.supabase,
        userId: params.userId,
      })
    case 'reschedule_sessions':
      return rescheduleSessionsAction({
        data: (params.body.data || {}) as ActionRequest<'reschedule_sessions'>['data'],
        supabase: params.supabase,
        userId: params.userId,
      })
    default:
      return { ok: false, error: `Accion no reconocida: ${params.body.action}`, status: 400 }
  }
}
