import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { getStudentDetailsData } from './student-details'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> | { id: string; userId: string } }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const resolvedParams = await Promise.resolve(params)
    const courseId = resolvedParams.id
    const userId = resolvedParams.userId

    if (!courseId || !userId) {
      console.error('[Student Details API] Missing parameters:', { courseId, userId })
      return NextResponse.json({ error: 'Parametros faltantes' }, { status: 400 })
    }

    const supabase = await createClient()
    const studentDetails = await getStudentDetailsData(supabase, courseId, userId)

    if (!studentDetails) {
      console.error('[Student Details API] Enrollment not found:', { courseId, userId })
      return NextResponse.json({ error: 'Inscripcion no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: studentDetails })
  } catch (error) {
    console.error('Error fetching student details:', error)
    return NextResponse.json(
      { error: 'Error al obtener detalles del estudiante' },
      { status: 500 },
    )
  }
}
