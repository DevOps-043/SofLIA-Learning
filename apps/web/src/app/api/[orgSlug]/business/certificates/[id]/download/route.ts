import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/[orgSlug]/business/certificates/[id]/download
 * Permite a los administradores de la organización descargar certificados de sus usuarios
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; id: string }> }
) {
  try {
    const { orgSlug, id } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        { error: 'No tienes una organización asignada' },
        { status: 403 }
      )
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID de certificado requerido' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Obtener el certificado y verificar que el usuario pertenece a la organización
    const { data: certificate, error: certificateError } = await supabase
      .from('user_course_certificates')
      .select(`
        certificate_id,
        certificate_url,
        user_id,
        course_id,
        courses!user_course_certificates_course_id_fkey (title)
      `)
      .eq('certificate_id', id)
      .single()

    if (certificateError || !certificate) {
      logger.error('Error fetching certificate for download:', certificateError)
      return NextResponse.json(
        { 
          error: 'Certificado no encontrado',
          details: certificateError?.message
        },
        { status: 404 }
      )
    }

    // Verificar que el usuario del certificado pertenece a la organización
    const { data: orgUser, error: orgUserError } = await supabase
      .from('organization_users')
      .select('user_id')
      .eq('organization_id', auth.organizationId)
      .eq('user_id', certificate.user_id)
      .single()

    if (orgUserError || !orgUser) {
      logger.error('User does not belong to organization:', orgUserError)
      return NextResponse.json(
        { 
          error: 'No tienes permiso para descargar este certificado',
          details: 'El usuario no pertenece a tu organización'
        },
        { status: 403 }
      )
    }

    // Obtener la URL del certificado
    const certificateUrl = certificate.certificate_url

    if (!certificateUrl) {
      return NextResponse.json(
        { error: 'URL del certificado no disponible' },
        { status: 404 }
      )
    }

    // Si la URL es una URL pública, intentar obtener el archivo desde Supabase Storage
    if (certificateUrl.startsWith('http://') || certificateUrl.startsWith('https://')) {
      try {
        // Extraer el path del bucket de la URL
        // Formato esperado: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
        const urlMatch = certificateUrl.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/)
        
        if (urlMatch) {
          const [, bucket, path] = urlMatch
          
          // Obtener el archivo desde Supabase Storage
          const { data, error: downloadError } = await supabase.storage
            .from(bucket)
            .download(path)

          if (downloadError || !data) {
            logger.error('Error downloading from storage:', downloadError)
            // Si falla, redirigir a la URL pública
            return NextResponse.redirect(certificateUrl)
          }

          // Convertir blob a array buffer
          const arrayBuffer = await data.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)

          // Determinar el tipo de contenido basado en la extensión
          const extension = path.split('.').pop()?.toLowerCase()
          let contentType = 'application/pdf'
          if (extension === 'png') contentType = 'image/png'
          else if (extension === 'jpg' || extension === 'jpeg') contentType = 'image/jpeg'
          else if (extension === 'pdf') contentType = 'application/pdf'

          // Obtener nombre del archivo
          const courseTitle = certificate.courses?.title || 'Certificado'
          const fileName = `${courseTitle.replace(/[^a-z0-9]/gi, '_')}_certificado.${extension || 'pdf'}`

          // Retornar el archivo con headers apropiados para descarga
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `attachment; filename="${fileName}"`,
              'Content-Length': buffer.length.toString()
            }
          })
        } else {
          // Si no es una URL de Supabase Storage, redirigir directamente
          return NextResponse.redirect(certificateUrl)
        }
      } catch (error) {
        logger.error('Error processing certificate download:', error)
        // Si hay error, redirigir a la URL pública
        return NextResponse.redirect(certificateUrl)
      }
    }

    // Si no es una URL HTTP, retornar error
    return NextResponse.json(
      { error: 'URL de certificado inválida' },
      { status: 400 }
    )
  } catch (error) {
    logger.error('💥 Error in /api/[orgSlug]/business/certificates/[id]/download:', error)
    return NextResponse.json(
      { 
        error: 'Error al descargar certificado',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
