import { NextRequest, NextResponse } from 'next/server'
import { AdminModulesService, CreateModuleData } from '@/features/admin/services/adminModules.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { id: courseId } = await params

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID es requerido' },
        { status: 400 }
      )
    }

    const modules = await AdminModulesService.getCourseModules(courseId)

    return NextResponse.json({
      success: true,
      modules
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener módulos' 
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { id: courseId } = await params
    const body = await request.json() as CreateModuleData
    const adminUserId = auth.userId

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID es requerido' },
        { status: 400 }
      )
    }

    if (!body.module_title) {
      return NextResponse.json(
        { error: 'module_title es requerido' },
        { status: 400 }
      )
    }

    const module = await AdminModulesService.createModule(courseId, body, adminUserId)

    return NextResponse.json({
      success: true,
      module
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al crear módulo' 
      },
      { status: 500 }
    )
  }
}

