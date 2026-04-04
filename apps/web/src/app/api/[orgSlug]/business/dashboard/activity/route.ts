import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'

interface ActivityItem {
  user: string;
  action: string;
  time: string;
  timestamp: Date;
  icon: string;
}

interface ActivityUserRow {
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
}

interface ActivityCourseRow {
  title: string | null;
}

interface CompletedCourseActivityRow {
  completed_at: string | null;
  completion_percentage: number | null;
  user: ActivityUserRow | null;
  course: ActivityCourseRow | null;
}

interface NewUserActivityRow {
  joined_at: string | null;
  user: ActivityUserRow | null;
}

interface StartedCourseActivityRow {
  assigned_at: string | null;
  completion_percentage: number | null;
  user: ActivityUserRow | null;
  course: ActivityCourseRow | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes una organización asignada'
        },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    const organizationId = auth.organizationId

    // 🚀 OPTIMIZACIÓN: Ejecutar TODAS las consultas en paralelo
    const [
      { data: orgData },
      { data: completedCourses },
      { data: newUsers },
      { data: startedCourses }
    ] = await Promise.all([
      // Nombre de la organización
      supabase
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single(),

      // Cursos completados recientes
      supabase
        .from('organization_course_assignments')
        .select(`
          completed_at,
          completion_percentage,
          user:users!inner (
            first_name,
            last_name,
            display_name
          ),
          course:courses!inner (
            title
          )
        `)
        .eq('organization_id', organizationId)
        .or('status.eq.completed,completion_percentage.gte.100')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(5)
        .returns<CompletedCourseActivityRow[]>(),

      // Usuarios que se unieron recientemente
      supabase
        .from('organization_users')
        .select(`
          joined_at,
          user:users!inner (
            first_name,
            last_name,
            display_name
          )
        `)
        .eq('organization_id', organizationId)
        .not('joined_at', 'is', null)
        .order('joined_at', { ascending: false })
        .limit(3)
        .returns<NewUserActivityRow[]>(),

      // Cursos iniciados recientemente
      supabase
        .from('organization_course_assignments')
        .select(`
          assigned_at,
          completion_percentage,
          user:users!inner (
            first_name,
            last_name,
            display_name
          ),
          course:courses!inner (
            title
          )
        `)
        .eq('organization_id', organizationId)
        .gt('completion_percentage', 0)
        .lt('completion_percentage', 100)
        .order('assigned_at', { ascending: false })
        .limit(3)
        .returns<StartedCourseActivityRow[]>()
    ])

    const orgName = orgData?.name || 'tu organización'
    const activities: ActivityItem[] = []

    // Procesar cursos completados
    if (completedCourses) {
      completedCourses.forEach((item) => {
        const userName = item.user?.display_name ||
          `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim() ||
          'Usuario'
        const courseTitle = item.course?.title || 'curso'

        activities.push({
          user: userName,
          action: `completó el curso de ${courseTitle}`,
          time: formatTimeAgo(item.completed_at),
          timestamp: new Date(item.completed_at),
          icon: 'CheckCircle'
        })
      })
    }

    // Procesar nuevos usuarios
    if (newUsers) {
      newUsers.forEach((item) => {
        const userName = item.user?.display_name ||
          `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim() ||
          'Usuario'

        activities.push({
          user: userName,
          action: `se unió a ${orgName}`,
          time: formatTimeAgo(item.joined_at),
          timestamp: new Date(item.joined_at),
          icon: 'Users'
        })
      })
    }

    // Procesar cursos iniciados
    if (startedCourses) {
      startedCourses.forEach((item) => {
        const userName = item.user?.display_name ||
          `${item.user?.first_name || ''} ${item.user?.last_name || ''}`.trim() ||
          'Usuario'
        const courseTitle = item.course?.title || 'curso'

        activities.push({
          user: userName,
          action: `inició el curso de ${courseTitle}`,
          time: formatTimeAgo(item.assigned_at),
          timestamp: new Date(item.assigned_at),
          icon: 'BookOpen'
        })
      })
    }

    // 🚀 OPTIMIZACIÓN: Ordenar por timestamp real en lugar de string
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Eliminar timestamp antes de enviar respuesta
    const cleanActivities = activities.slice(0, 10).map(({ timestamp, ...rest }) => rest)

    return NextResponse.json({
      success: true,
      activities: cleanActivities
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=120'
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/[orgSlug]/business/dashboard/activity:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener actividad reciente',
        activities: []
      },
      { status: 500 }
    )
  }
}

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return 'hace mucho tiempo'

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'hace menos de 1 hora'
  if (diffHours === 1) return 'hace 1 hora'
  if (diffHours < 24) return `hace ${diffHours} horas`
  if (diffDays === 1) return 'hace 1 día'
  if (diffDays < 7) return `hace ${diffDays} días`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return weeks === 1 ? 'hace 1 semana' : `hace ${weeks} semanas`
  }
  const months = Math.floor(diffDays / 30)
  return months === 1 ? 'hace 1 mes' : `hace ${months} meses`
}
