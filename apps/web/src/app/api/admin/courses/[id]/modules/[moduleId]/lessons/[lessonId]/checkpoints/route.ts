import { NextRequest, NextResponse } from 'next/server'
import { AdminCheckpointsService, CreateCheckpointData } from '@/features/admin/services/adminCheckpoints.service'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string, lessonId: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { lessonId } = await params

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID es requerido' },
        { status: 400 }
      )
    }

    const checkpoints = await AdminCheckpointsService.getLessonCheckpoints(lessonId)

    return NextResponse.json({
      success: true,
      checkpoints
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener checkpoints' 
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, moduleId: string, lessonId: string }> }
) {
  try {
    const { lessonId } = await params
    const body = await request.json() as CreateCheckpointData

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID es requerido' },
        { status: 400 }
      )
    }

    if (body.checkpoint_time_seconds === undefined) {
      return NextResponse.json(
        { error: 'checkpoint_time_seconds es requerido' },
        { status: 400 }
      )
    }

    const checkpoint = await AdminCheckpointsService.createCheckpoint(lessonId, body)

    return NextResponse.json({
      success: true,
      checkpoint
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al crear checkpoint' 
      },
      { status: 500 }
    )
  }
}

