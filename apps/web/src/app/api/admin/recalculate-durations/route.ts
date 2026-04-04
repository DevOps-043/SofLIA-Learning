import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AdminLessonsService } from '@/features/admin/services/adminLessons.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

/**
 * POST /api/admin/recalculate-durations
 * 
 * Recalcula la duración total de todas las lecciones en la base de datos.
 * Suma: video + materiales + actividades para cada lección.
 * 
 * REQUIERE: Usuario autenticado con rol de Admin
 * 
 * Este endpoint es útil para corregir datos existentes que no fueron
 * calculados correctamente o después de migraciones.
 * 
 * Respuesta:
 * - updated: número de lecciones actualizadas
 * - errors: lista de errores encontrados (si los hay)
 */
export async function POST() {
  // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

    try {
        // Verificar autenticación
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'No autorizado. Debes iniciar sesión.' },
                { status: 401 }
            )
        }

        // Verificar que el usuario sea admin
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userError || !userData) {
            return NextResponse.json(
                { success: false, error: 'No se pudo verificar el rol del usuario.' },
                { status: 403 }
            )
        }

        const userRole = userData.role
        if (userRole !== 'Admin' && userRole !== 'SuperAdmin') {
            return NextResponse.json(
                { success: false, error: 'Solo los administradores pueden ejecutar esta acción.' },
                { status: 403 }
            )
        }


        const startTime = Date.now()
        const result = await AdminLessonsService.recalculateAllLessonDurations()
        const elapsedTime = Date.now() - startTime


        return NextResponse.json({
            success: true,
            message: `Se recalcularon ${result.updated} lecciones correctamente en ${(elapsedTime / 1000).toFixed(2)}s`,
            updated: result.updated,
            errors: result.errors,
            executedBy: user.email,
            elapsedMs: elapsedTime
        })
    } catch (error) {
        console.error('[API] Error recalculating durations:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            },
            { status: 500 }
        )
    }
}

/**
 * GET /api/admin/recalculate-durations
 * Retorna información sobre el endpoint
 */
export async function GET() {
  // ✅ SEGURIDAD: Verificar autenticación y autorización de admin
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

    return NextResponse.json({
        endpoint: '/api/admin/recalculate-durations',
        method: 'POST',
        description: 'Recalcula la duración total de todas las lecciones (video + materiales + actividades)',
        usage: 'Envía una petición POST a este endpoint para recalcular todas las duraciones',
        requires: 'Autenticación como Admin o SuperAdmin'
    })
}
