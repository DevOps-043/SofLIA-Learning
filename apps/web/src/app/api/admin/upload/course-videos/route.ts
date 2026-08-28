import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fileTypeFromBuffer } from 'file-type'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import {
  COURSE_VIDEO_MAX_SIZE_BYTES,
  VIDEO_ASSET_CACHE_CONTROL,
  isStreamableVideoMimeType,
} from '@/lib/media/video-upload-policy'
import { dispatchTranscodingJob } from '@/lib/media/server/transcoding-dispatcher.server'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const contentLength = request.headers.get('content-length')
    const sizeBytes = contentLength ? Number(contentLength) : Number.NaN
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      return NextResponse.json({ error: 'Content-Length requerido' }, { status: 411 })
    }
    if (sizeBytes > COURSE_VIDEO_MAX_SIZE_BYTES + 1024 * 1024) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo de 1GB' },
        { status: 413 },
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta. Variables de entorno faltantes.' },
        { status: 500 },
      )
    }

    let formData: FormData
    try {
      formData = await request.formData()
    } catch (formDataError) {
      return NextResponse.json(
        { error: 'Error al leer el archivo. El archivo puede ser demasiado grande o estar corrupto.', details: formDataError instanceof Error ? formDataError.message : 'Error desconocido' },
        { status: 400 },
      )
    }

    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo de video' }, { status: 400 })
    }
    if (file.size > COURSE_VIDEO_MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'El video excede el tamaño máximo de 1GB' }, { status: 400 })
    }
    if (!isStreamableVideoMimeType(file.type)) {
      return NextResponse.json({ error: 'Tipo de video no permitido. Solo se permiten MP4 o WebM', receivedType: file.type }, { status: 400 })
    }

    const signatureBytes = Buffer.from(await file.slice(0, 8192).arrayBuffer())
    const detectedType = await fileTypeFromBuffer(signatureBytes)
    if (!detectedType || !isStreamableVideoMimeType(detectedType.mime)) {
      return NextResponse.json(
        { error: 'La firma real del archivo no corresponde a MP4 o WebM' },
        { status: 400 },
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    if (bucketsError) {
      return NextResponse.json({ error: 'Error al acceder al almacenamiento', details: bucketsError.message }, { status: 500 })
    }
    if (!buckets?.some((b) => b.name === 'course-videos')) {
      return NextResponse.json({ error: 'El bucket course-videos no existe. Créalo en Supabase.' }, { status: 500 })
    }

    const fileName = `${crypto.randomUUID()}.${detectedType.ext}`
    const filePath = `videos/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('course-videos')
      .upload(filePath, file, { cacheControl: VIDEO_ASSET_CACHE_CONTROL, upsert: false, contentType: detectedType.mime })

    if (uploadError || !uploadData) {
      return NextResponse.json({ error: 'Error al subir el video', details: uploadError?.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('course-videos').getPublicUrl(filePath)
    if (!urlData?.publicUrl) {
      return NextResponse.json({ error: 'Error al obtener la URL pública del video' }, { status: 500 })
    }

    // Dispatch async transcoding job (no-op when VIDEO_TRANSCODING_ENABLED is false)
    const transcoding = await dispatchTranscodingJob({
      supabase,
      sourcePath: filePath,
      sourceUrl: urlData.publicUrl,
      bucket: 'course-videos',
      contentType: detectedType.mime,
      sizeBytes: file.size,
    })

    return NextResponse.json({
      success: true,
      url: transcoding.playbackUrl,
      path: transcoding.playbackPath,
      sourcePath: filePath,
      sourceUrl: urlData.publicUrl,
      transcoding: transcoding.status,
      jobId: transcoding.jobId ?? null,
      name: file.name,
      size: file.size,
      type: detectedType.mime,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor', details: process.env.NODE_ENV === 'development' ? errorMessage : undefined },
      { status: 500 },
    )
  }
}
