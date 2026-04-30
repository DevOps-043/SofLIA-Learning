import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient as createServiceClient } from '@supabase/supabase-js'

import { requireBusiness } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ orgSlug: string }>
}

const BUCKET = 'intro-videos'
const ALLOWED_EXTENSIONS = ['mp4', 'webm']
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024

const BodySchema = z.object({
  fileName: z.string().min(1),
  contentType: z.enum(['video/mp4', 'video/webm']),
  fileSize: z.number().int().positive().optional(),
  folder: z.string().max(120).optional(),
})

/**
 * Genera una signed upload URL para subir un video introductorio directamente
 * desde el browser al bucket de Supabase, evitando el límite de payload de
 * las funciones serverless.
 *
 * Flujo:
 *   1. Cliente llama POST aquí → recibe { signedUrl, path, token, publicUrl }
 *   2. Cliente hace PUT signedUrl con el binario del archivo (Content-Type: video/*)
 *   3. Cliente guarda publicUrl via PUT /intro-videos/learning-path/[id] o /course/[id]
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    if (!auth.organizationId) {
      return NextResponse.json({ success: false, error: 'Organización no encontrada' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 })
    }

    const { fileName, contentType, fileSize, folder } = parsed.data

    // Validar extensión del archivo
    const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ success: false, error: `Extensión no permitida: .${ext}` }, { status: 400 })
    }

    if (fileSize && fileSize > MAX_VIDEO_SIZE_BYTES) {
      return NextResponse.json({ success: false, error: 'El video introductorio es demasiado grande. Máximo 100MB' }, { status: 400 })
    }

    // Generar path único: org/{orgSlug}/{folder?}/{timestamp}-{random}.{ext}
    const timestamp = Date.now()
    const random = Math.random().toString(36).slice(2, 8)
    const safeFolder = folder?.replace(/[^a-zA-Z0-9/_-]/g, '') || 'general'
    const storagePath = `org/${orgSlug}/${safeFolder}/${timestamp}-${random}.${ext}`

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createServiceClient(supabaseUrl, serviceKey)

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath)

    if (error || !data) {
      logger.error('Error creating signed upload URL:', error)
      return NextResponse.json({ success: false, error: 'No se pudo generar la URL de subida' }, { status: 500 })
    }

    // URL pública una vez completado el upload
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
      token: data.token,
      path: storagePath,
      publicUrl: urlData.publicUrl,
      // El cliente usará esta URL para registrar el video tras completar el upload
    })
  } catch (error) {
    logger.error('POST upload-url error:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
