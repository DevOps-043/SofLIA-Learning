import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/utils/logger'
import { generateSafeFileName } from '@/lib/upload/validation'
import { validateAndPrepareUpload } from '@/lib/upload/validation.server'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuracion del servidor incompleta' },
        { status: 500 },
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const materialType = formData.get('materialType')?.toString() || 'pdf'

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'No se proporciono archivo' },
        { status: 400 },
      )
    }

    const uploadValidation = await validateAndPrepareUpload(file, 'documents')
    if (!uploadValidation.valid || !uploadValidation.file) {
      return NextResponse.json(
        { error: uploadValidation.error || 'Archivo no permitido' },
        { status: uploadValidation.antimalwareRequired ? 503 : 400 },
      )
    }

    const preparedFile = uploadValidation.file
    const folder = materialType === 'pdf' ? 'pdfs' : 'documents'
    const fileName = generateSafeFileName(file.name, preparedFile.detectedExtension)
    const filePath = `${folder}/${fileName}`
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error } = await supabase.storage
      .from('course-materials')
      .upload(filePath, preparedFile.body, {
        cacheControl: '3600',
        contentType: preparedFile.contentType,
        upsert: false,
      })

    if (error) {
      logger.error('Error uploading course material', {
        code: error.name,
        message: error.message,
      })
      return NextResponse.json(
        { error: 'Error al subir el material' },
        { status: 500 },
      )
    }

    const { data: urlData } = supabase.storage
      .from('course-materials')
      .getPublicUrl(filePath)

    return NextResponse.json({
      name: file.name,
      path: filePath,
      size: preparedFile.sizeBytes,
      success: true,
      type: preparedFile.contentType,
      url: urlData.publicUrl,
    })
  } catch (error) {
    logger.error('Error in course material upload API', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    )
  }
}
