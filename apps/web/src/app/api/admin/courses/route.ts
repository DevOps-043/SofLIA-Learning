import { NextResponse } from 'next/server'
import { logger } from '../../../../lib/utils/logger';
import { AdminCoursesService } from '../../../../features/admin/services/adminCourses.service'
import { requireAdmin } from '../../../../lib/auth/requireAdmin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const courses = await AdminCoursesService.getAllCourses()
    
    return NextResponse.json({
      success: true,
      courses
    })
  } catch (error: unknown) {
    logger.error('Error in GET /api/admin/courses:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener los cursos' 
      },
      { status: 500 }
    )
  }
}
