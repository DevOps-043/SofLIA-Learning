import { NextResponse } from 'next/server'
import type { createClient } from '@/lib/supabase/server'
import { SessionService } from '@/features/auth/services/session.service'
import type { CourseLookup } from './types'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export async function getOptionalCourseSkillUser(supabase: SupabaseServerClient) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('id, cargo_rol')
    .eq('id', user.id)
    .single()

  return userData ? { user: userData } : null
}

export async function authorizeCourseSkillEdit(
  supabase: SupabaseServerClient,
  course: CourseLookup,
) {
  const currentUser = await SessionService.getCurrentUser()
  if (!currentUser) {
    return {
      response: NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      ),
    }
  }

  const { data: userData } = await supabase
    .from('users')
    .select('id, cargo_rol')
    .eq('id', currentUser.id)
    .single()

  if (!userData) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 },
      ),
    }
  }

  const isInstructor = course.instructor_id === currentUser.id
  const isAdmin = userData.cargo_rol?.toLowerCase().trim() === 'administrador'
  if (!isInstructor && !isAdmin) {
    return {
      response: NextResponse.json(
        { success: false, error: 'No tienes permisos para editar este curso' },
        { status: 403 },
      ),
    }
  }

  return { currentUser }
}
