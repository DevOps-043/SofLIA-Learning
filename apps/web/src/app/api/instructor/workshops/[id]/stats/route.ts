import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  try {

    // Enrollments con información de usuarios
    const { data: enrollments, error: enrErr } = await supabase
      .from('user_course_enrollments')
      .select(`
        enrollment_id,
        enrollment_status,
        overall_progress_percentage,
        enrolled_at,
        started_at,
        completed_at,
        last_accessed_at,
        user_id,
        users!inner (
          id,
          username,
          display_name,
          first_name,
          last_name,
          email,
          profile_picture_url
        )
      `)
      .eq('course_id', id)

    if (enrErr) throw enrErr

    const total_enrolled = enrollments?.length || 0
    let completed = 0
    let in_progress = 0
    let not_started = 0
    let progress_sum = 0

    // Lista de usuarios inscritos
    const enrolledUsers = (enrollments || []).map((enr: any) => {
      const user = enr.users
      const p = Number(enr.overall_progress_percentage) || 0
      progress_sum += p

      if (p >= 100 || enr.enrollment_status === 'completed') completed++
      else if (p > 0) in_progress++
      else not_started++

      return {
        enrollment_id: enr.enrollment_id,
        user_id: enr.user_id,
        username: user?.username || 'Usuario',
        display_name: user?.display_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || 'Usuario',
        email: user?.email || '',
        profile_picture: user?.profile_picture_url || null,
        enrollment_status: enr.enrollment_status,
        progress_percentage: p,
        enrolled_at: enr.enrolled_at,
        started_at: enr.started_at,
        completed_at: enr.completed_at,
        last_accessed_at: enr.last_accessed_at,
      }
    })

    const average_progress = total_enrolled > 0 ? progress_sum / total_enrolled : 0

    // Última actividad
    const { data: lastProg } = await supabase
      .from('user_course_enrollments')
      .select('last_accessed_at')
      .eq('course_id', id)
      .order('last_accessed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Compras, Reseñas y Certificados en paralelo
    const [purchasesRes, reviewsRes, certificatesRes] = await Promise.all([
      supabase.from('course_purchases').select('final_price_cents, purchased_at, access_status').eq('course_id', id),
      supabase.from('course_reviews').select('rating, review_id').eq('course_id', id),
      supabase.from('user_course_certificates').select('certificate_id').eq('course_id', id),
    ])

    const purchases = purchasesRes.data || []
    const reviews = reviewsRes.data || []
    const certificates = certificatesRes.data || []

    const total_purchases = purchases.length
    const activePurchaseList = purchases.filter((p: any) => p.access_status === 'active')
    const active_purchases = activePurchaseList.length
    // Precio oficial del curso
    const { data: courseRow } = await supabase
      .from('courses')
      .select('price')
      .eq('id', id)
      .maybeSingle()
    const course_price = Number(courseRow?.price || 0)
    // Ingresos derivados: número de compras activas x precio del curso
    const total_revenue_dollars = Math.max(0, active_purchases * course_price)

    const total_reviews = reviews.length
    const average_rating = reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
      : 0

    const total_certificates = certificates.length

    // Obtener módulos del curso
    const { data: modules } = await supabase
      .from('course_modules')
      .select('module_id')
      .eq('course_id', id)

    const moduleIds = modules?.map(m => m.module_id) || []
    
    // Obtener lecciones del curso
    const { data: lessons } = await supabase
      .from('course_lessons')
      .select('lesson_id')
      .in('module_id', moduleIds.length > 0 ? moduleIds : ['00000000-0000-0000-0000-000000000000'])

    const total_lessons = lessons?.length || 0
    const lessonIds = lessons?.map(l => l.lesson_id) || []

    // Consultas dependientes de lessonIds en paralelo (solo conteos, sin payload)
    const [userNotesRes, lessonProgressRes, materialsRes, activitiesRes] = await Promise.all([
      supabase.from('user_lesson_notes').select('note_id', { count: 'exact', head: true }).in('lesson_id', lessonIds.length > 0 ? lessonIds : ['00000000-0000-0000-0000-000000000000']),
      supabase.from('user_lesson_progress').select('is_completed, lesson_id', { count: 'exact', head: true }).eq('is_completed', true).in('lesson_id', lessonIds.length > 0 ? lessonIds : ['00000000-0000-0000-0000-000000000000']),
      supabase.from('lesson_materials').select('material_id', { count: 'exact', head: true }).in('lesson_id', lessonIds.length > 0 ? lessonIds : ['00000000-0000-0000-0000-000000000000']),
      supabase.from('lesson_activities').select('activity_id', { count: 'exact', head: true }).in('lesson_id', lessonIds.length > 0 ? lessonIds : ['00000000-0000-0000-0000-000000000000']),
    ])

    const total_notes = userNotesRes.count || 0
    const completed_activities = lessonProgressRes.count || 0
    const total_materials = materialsRes.count || 0
    const total_activities = activitiesRes.count || 0

    // Usuarios activos en últimos 7 y 30 días
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const active_7d = enrolledUsers.filter(u => 
      u.last_accessed_at && new Date(u.last_accessed_at) >= sevenDaysAgo
    ).length

    const active_30d = enrolledUsers.filter(u => 
      u.last_accessed_at && new Date(u.last_accessed_at) >= thirtyDaysAgo
    ).length

    // Preparar datos simplificados para gráfica de tendencia por mes
    const studentStatusByMonth: Array<{ mes: string; completados: number; enProgreso: number; noIniciados: number }> = []
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    
    // Temporalmente: usar solo datos actuales para evitar error 500
    studentStatusByMonth.push({
      mes: monthNames[now.getMonth()],
      completados: completed,
      enProgreso: in_progress,
      noIniciados: not_started
    })
    
    // Mantener también la tendencia de inscripciones diarias (últimos 30 días) para otras gráficas
    const { data: historicalEnrollments } = await supabase
      .from('user_course_enrollments')
      .select('enrolled_at, completed_at, enrollment_status')
      .eq('course_id', id)
      .gte('enrolled_at', thirtyDaysAgo.toISOString())

    const dateMap = new Map<string, { enrollments: number; completions: number }>()
    const enrollmentTrend: Array<{ date: string; enrollments: number; completions: number }> = []
    
    // Inicializar últimos 30 días
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dateMap.set(dateStr, { enrollments: 0, completions: 0 })
    }
    
    historicalEnrollments?.forEach((enr: any) => {
      const enrollDate = new Date(enr.enrolled_at).toISOString().split('T')[0]
      const entry = dateMap.get(enrollDate)
      if (entry) {
        entry.enrollments++
        if (enr.enrollment_status === 'completed' && enr.completed_at) {
          const completeDate = new Date(enr.completed_at).toISOString().split('T')[0]
          const completeEntry = dateMap.get(completeDate)
          if (completeEntry) completeEntry.completions++
        }
      }
    })
    
    dateMap.forEach((value, key) => {
      enrollmentTrend.push({
        date: new Date(key).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        enrollments: value.enrollments,
        completions: value.completions,
      })
    })

    // Distribución de progreso (histograma)
    const progressDistribution: Array<{ range: string; count: number }> = [
      { range: '0-20%', count: 0 },
      { range: '21-40%', count: 0 },
      { range: '41-60%', count: 0 },
      { range: '61-80%', count: 0 },
      { range: '81-100%', count: 0 },
    ]
    
    enrolledUsers.forEach((user: any) => {
      const progress = user.progress_percentage
      if (progress <= 20) progressDistribution[0].count++
      else if (progress <= 40) progressDistribution[1].count++
      else if (progress <= 60) progressDistribution[2].count++
      else if (progress <= 80) progressDistribution[3].count++
      else progressDistribution[4].count++
    })

    // Datos de engagement para scatter chart (sin conteo de notas por usuario)
    const engagementData = enrolledUsers.map((user: any) => {
      const enrolledDate = user.enrolled_at ? new Date(user.enrolled_at) : new Date()
      const lastAccessDate = user.last_accessed_at ? new Date(user.last_accessed_at) : enrolledDate
      const daysActive = Math.max(0, Math.floor((lastAccessDate.getTime() - enrolledDate.getTime()) / (1000 * 60 * 60 * 24)))
      
      return {
        progress: user.progress_percentage,
        days_active: daysActive,
        notes_created: 0,
        user_id: user.user_id,
      }
    })

    // Análisis estadístico profundo
    const progressValues = enrolledUsers.map((u: any) => u.progress_percentage).filter((p: number) => p !== null)
    const sortedProgress = [...progressValues].sort((a: number, b: number) => a - b)
    
    const median = sortedProgress.length > 0
      ? sortedProgress.length % 2 === 0
        ? (sortedProgress[sortedProgress.length / 2 - 1] + sortedProgress[sortedProgress.length / 2]) / 2
        : sortedProgress[Math.floor(sortedProgress.length / 2)]
      : 0

    const variance = progressValues.length > 0
      ? progressValues.reduce((acc: number, val: number) => acc + Math.pow(val - average_progress, 2), 0) / progressValues.length
      : 0

    const stdDeviation = Math.sqrt(variance)

    // Quartiles
    const q1 = sortedProgress.length > 0 ? sortedProgress[Math.floor(sortedProgress.length * 0.25)] : 0
    const q3 = sortedProgress.length > 0 ? sortedProgress[Math.floor(sortedProgress.length * 0.75)] : 0
    const iqr = q3 - q1

    // Tasa de retención (usuarios activos en últimos 30 días / total inscritos)
    const retention_rate = total_enrolled > 0 ? (active_30d / total_enrolled) * 100 : 0
    
    // Tasa de finalización (completados / inscritos)
    const completion_rate = total_enrolled > 0 ? (completed / total_enrolled) * 100 : 0
    
    // Tasa de inscripción por período (para gráfica de líneas)
    const enrollmentRate = enrollmentTrend.map((entry: any) => ({
      period: entry.date,
      enrollment_rate: entry.enrollments,
      completion_rate: entry.completions,
      retention_rate: active_30d > 0 ? (active_30d / total_enrolled) * 100 : 0,
    }))

    // Análisis temporal (días activos promedio, tiempo de finalización promedio)
    const completedUsers = enrolledUsers.filter((u: any) => u.enrollment_status === 'completed' && u.completed_at && u.started_at)
    const completionTimes = completedUsers.map((u: any) => {
      const start = new Date(u.started_at).getTime()
      const complete = new Date(u.completed_at).getTime()
      return Math.floor((complete - start) / (1000 * 60 * 60 * 24)) // días
    })

    const avgCompletionDays = completionTimes.length > 0
      ? completionTimes.reduce((sum: number, days: number) => sum + days, 0) / completionTimes.length
      : 0

    // Construir distribución por rol (tabla roles) y por área con una sola consulta
    const rolesCount = new Map<string, number>()
    const areaCount = new Map<string, number>()
    let rolesPie: Array<{ name: string, count: number }> = []
    let areasPie: Array<{ name: string, count: number }> = []
    if (enrolledUsers.length > 0) {
      const enrolledIds = enrolledUsers.map((u: any) => u.user_id)
      const { data: perfiles } = await supabase
        .from('user_perfil')
        .select(`
          user_id,
          rol:roles!inner ( nombre ),
          area:areas!inner ( nombre )
        `)
        .in('user_id', enrolledIds)

      ;(perfiles || []).forEach((p: any) => {
        const roleName = (p.rol?.nombre || 'Sin rol').toString()
        const areaName = (p.area?.nombre || 'Sin área').toString()
        rolesCount.set(roleName, (rolesCount.get(roleName) || 0) + 1)
        areaCount.set(areaName, (areaCount.get(areaName) || 0) + 1)
      })

      rolesPie = Array.from(rolesCount.entries()).map(([name, count]) => ({ name, count }))
      areasPie = Array.from(areaCount.entries()).map(([name, count]) => ({ name, count }))
    }

    return NextResponse.json({
      success: true,
      stats: {
        // Estadísticas de usuarios
        total_enrolled,
        completed,
        in_progress,
        not_started,
        average_progress,
        active_7d,
        active_30d,
        last_activity_at: lastProg?.last_accessed_at || null,
        
        // Estadísticas financieras
        total_purchases,
        active_purchases,
        course_price,
        total_revenue_cents: Math.round(total_revenue_dollars * 100),
        total_revenue_display: `$${total_revenue_dollars.toFixed(2)}`,
        
        // Estadísticas de contenido
        total_reviews,
        average_rating: Math.round(average_rating * 10) / 10,
        total_certificates,
        total_notes,
        completed_activities,
        total_lessons,
        total_materials,
        total_activities,

        // Análisis estadístico profundo
        median_progress: median,
        std_deviation: Math.round(stdDeviation * 10) / 10,
        variance: Math.round(variance * 10) / 10,
        q1_progress: q1,
        q3_progress: q3,
        iqr_progress: iqr,
        min_progress: sortedProgress.length > 0 ? sortedProgress[0] : 0,
        max_progress: sortedProgress.length > 0 ? sortedProgress[sortedProgress.length - 1] : 0,
        
        // Métricas de RRHH
        retention_rate: Math.round(retention_rate * 10) / 10,
        completion_rate: Math.round(completion_rate * 10) / 10,
        avg_completion_days: Math.round(avgCompletionDays * 10) / 10,
      },
      enrolled_users: enrolledUsers.sort((a, b) => {
        // Ordenar por última actividad (más reciente primero)
        const dateA = a.last_accessed_at ? new Date(a.last_accessed_at).getTime() : 0
        const dateB = b.last_accessed_at ? new Date(b.last_accessed_at).getTime() : 0
        return dateB - dateA
      }),
      // Datos para gráficas
      charts: {
        enrollment_trend: enrollmentTrend,
        progress_distribution: progressDistribution,
        engagement_data: engagementData,
        enrollment_rates: enrollmentRate,
        user_roles_pie: rolesPie,
        user_areas_pie: areasPie,
        student_status_by_month: studentStatusByMonth,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Error obteniendo estadísticas' }, { status: 500 })
  }
}


