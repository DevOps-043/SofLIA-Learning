import { NextRequest, NextResponse } from 'next/server'

import { apiError } from '@/lib/api/errors'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/utils/logger'

interface RouteContext {
  params: Promise<{ orgSlug: string; structureId: string }>
}

/**
 * DELETE /api/[orgSlug]/business/hierarchy/structures/[structureId]
 *
 * Guards:
 *  - Caller must be Business role for this org
 *  - Structure must belong to the caller's org (prevents cross-org deletion)
 *  - Cannot delete the last remaining structure (org must keep at least one)
 *
 * The DB cascade (migration 20260626000002) removes all child nodes,
 * node_users, node_courses, and node_objectives automatically.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { orgSlug, structureId } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organización asignada', 403)
    }

    const supabase = createAdminClient()

    // Verify the structure exists and belongs to this org.
    const { data: structure, error: fetchError } = await supabase
      .from('organization_structures')
      .select('id, name, is_default')
      .eq('id', structureId)
      .eq('organization_id', auth.organizationId)
      .single()

    if (fetchError || !structure) {
      return apiError('STRUCTURE_NOT_FOUND', 'Estructura no encontrada', 404)
    }

    // Prevent deleting the last structure.
    const { count, error: countError } = await supabase
      .from('organization_structures')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', auth.organizationId)

    if (countError) {
      logger.error('Error contando estructuras:', { message: countError.message })
      return apiError('DELETE_STRUCTURE_FAILED', 'Error al eliminar la estructura', 500)
    }

    if ((count ?? 0) <= 1) {
      return apiError(
        'CANNOT_DELETE_LAST_STRUCTURE',
        'No se puede eliminar la única estructura de la organización',
        409,
      )
    }

    // Delete — cascade removes all child nodes and dependent rows.
    const { error: deleteError } = await supabase
      .from('organization_structures')
      .delete()
      .eq('id', structureId)
      .eq('organization_id', auth.organizationId)

    if (deleteError) {
      logger.error('Error eliminando estructura:', { code: deleteError.code, message: deleteError.message })
      return apiError('DELETE_STRUCTURE_FAILED', 'Error al eliminar la estructura', 500)
    }

    // Keep one canonical structure for analytics and other server-side consumers.
    // This also repairs legacy organizations where no structure was marked default.
    const { data: remainingDefault } = await supabase
      .from('organization_structures')
      .select('id')
      .eq('organization_id', auth.organizationId)
      .eq('is_default', true)
      .limit(1)
      .maybeSingle()

    if (!remainingDefault) {
      const { data: replacement } = await supabase
        .from('organization_structures')
        .select('id')
        .eq('organization_id', auth.organizationId)
        .order('name', { ascending: true })
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (replacement) {
        await supabase
          .from('organization_structures')
          .update({ is_default: true, updated_at: new Date().toISOString() })
          .eq('id', replacement.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error en DELETE /api/[orgSlug]/business/hierarchy/structures/[structureId]:', error)
    return apiError('DELETE_STRUCTURE_FAILED', 'Error al eliminar la estructura', 500)
  }
}
