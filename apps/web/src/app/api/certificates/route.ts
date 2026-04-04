import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { SessionService } from '@/features/auth/services/session.service'
import { createClient } from '@/lib/supabase/server'

interface CertificateCourseRow {
  id: string
  title?: string | null
  slug?: string | null
  thumbnail_url?: string | null
  instructor_id?: string | null
}

interface CertificateRow {
  certificate_id: string
  certificate_url: string | null
  certificate_hash: string | null
  issued_at: string | null
  expires_at: string | null
  created_at: string
  course_id: string | null
  enrollment_id: string | null
  courses?: CertificateCourseRow | null
}

interface CertificateInstructorInfo {
  name: string
  username: string | null
  signature_url: string | null
  signature_name: string | null
}

/**
 * GET /api/certificates
 * Obtiene todos los certificados del usuario autenticado
 * Incluye información enriquecida: nombre del curso, instructor, fecha de emisión, etc.
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener usuario usando el sistema de sesiones
    const currentUser = await SessionService.getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Obtener certificados del usuario con información enriquecida
    const { data: certificates, error: certificatesError } = await supabase
      .from('user_course_certificates')
      .select(`
        certificate_id,
        certificate_url,
        certificate_hash,
        issued_at,
        expires_at,
        created_at,
        course_id,
        enrollment_id,
        courses (
          id,
          title,
          slug,
          thumbnail_url,
          instructor_id
        )
      `)
      .eq('user_id', currentUser.id)
      .order('issued_at', { ascending: false })

    if (certificatesError) {
      logger.error('Error fetching certificates:', certificatesError)
      return NextResponse.json(
        { 
          error: 'Error al obtener certificados',
          details: certificatesError.message
        },
        { status: 500 }
      )
    }

    // Obtener IDs de instructores únicos
    const certificateRows: CertificateRow[] = certificates || []
    const instructorIds = [...new Set(certificateRows
      .map((cert) => cert.courses?.instructor_id)
      .filter(Boolean))]

    // Obtener información de instructores (incluyendo firma)
    const instructorMap = new Map<string, CertificateInstructorInfo>()
    if (instructorIds.length > 0) {
      const { data: instructors } = await supabase
        .from('users')
        .select('id, first_name, last_name, username, signature_url, signature_name')
        .in('id', instructorIds)

      if (instructors) {
        instructors.forEach(instructor => {
          const fullName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim()
          instructorMap.set(instructor.id, {
            name: fullName || instructor.username || 'Instructor',
            username: instructor.username,
            signature_url: instructor.signature_url,
            signature_name: instructor.signature_name
          })
        })
      }
    }

    // Obtener información del usuario actual
    const { data: currentUserData } = await supabase
      .from('users')
      .select('first_name, last_name, username, display_name')
      .eq('id', currentUser.id)
      .single()

    const userName = currentUserData?.display_name || 
      (currentUserData?.first_name && currentUserData?.last_name 
        ? `${currentUserData.first_name} ${currentUserData.last_name}`.trim()
        : currentUserData?.username || 'Estudiante')

    // Enriquecer certificados con datos del curso e instructor
    const enrichedCertificates = certificateRows.map((cert) => {
      const course = cert.courses || {}
      const instructor = course.instructor_id ? instructorMap.get(course.instructor_id) : null
      
      return {
        certificate_id: cert.certificate_id,
        certificate_url: cert.certificate_url,
        certificate_hash: cert.certificate_hash,
        issued_at: cert.issued_at,
        expires_at: cert.expires_at,
        created_at: cert.created_at,
        course_id: cert.course_id,
        enrollment_id: cert.enrollment_id,
        course_title: course.title || 'Curso sin título',
        course_slug: course.slug || '',
        course_thumbnail: course.thumbnail_url || null,
        instructor_name: instructor?.name || 'Instructor',
        instructor_username: instructor?.username || null,
        instructor_signature_url: instructor?.signature_url || null,
        instructor_signature_name: instructor?.signature_name || null,
        user_name: userName
      }
    })

    logger.log(`✅ Fetched ${enrichedCertificates.length} certificates for user ${currentUser.id}`)

    return NextResponse.json({
      success: true,
      certificates: enrichedCertificates,
      count: enrichedCertificates.length
    })
  } catch (error) {
    logger.error('Error in /api/certificates:', error)
    return NextResponse.json(
      { 
        error: 'Error al obtener certificados',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
