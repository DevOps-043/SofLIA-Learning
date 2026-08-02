import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import os from 'os'

import { getAiModelSettings } from '@/lib/ai/model-settings/ai-model-settings.server.service'
import { buildManagedGenerationConfig } from '@/lib/ai/model-settings/generation-config'
import {
  buildPlainTranscript,
  parseTranscriptSegments,
} from '@/lib/course-content/transcript-segments'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import {
  CIRCUIT_BREAKER_DEFAULTS,
  executeWithCircuitBreaker,
} from '@/lib/resilience/circuit-breaker'
import {
  getSafeFetchSupabaseHosts,
  safeFetch,
} from '@/lib/security/safe-fetch'
import { logger } from '@/lib/utils/logger'

import { processVideoSchema, type ProcessVideoBody } from './schema'

export const runtime = 'nodejs'
export const maxDuration = 300

async function handlePost(_request: NextRequest, body: ProcessVideoBody) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const googleApiKey = process.env.GOOGLE_API_KEY
  if (!googleApiKey) {
    return apiError(
      'GOOGLE_API_KEY_MISSING',
      'GOOGLE_API_KEY no configurada',
      500,
    )
  }

  const tempDir = os.tmpdir()
  const fileName = `temp-video-${Date.now()}.mp4`
  const filePath = join(tempDir, fileName)

  try {
    const videoResponse = await safeFetch(
      body.videoUrl,
      { cache: 'no-store' },
      {
        // Se permite descargar de CUALQUIER proyecto Supabase (`*.supabase.co`),
        // no solo del principal. Los vídeos de las lecciones pueden vivir en otro
        // proyecto (p. ej. SofLIA Engine), y exigir declarar cada project-ref a
        // mano en SAFE_FETCH_ALLOWED_HOSTS era frágil: esos identificadores usan
        // caracteres indistinguibles a la vista (l/1, I/O) y un error de una letra
        // bloquea la descarga entera. `safeFetch` sigue protegiendo lo que importa
        // (bloquea IPs privadas/reservadas), el endpoint es admin-only, y el destino
        // queda limitado al dominio de Supabase: no a un host arbitrario.
        allowedHosts: [...getSafeFetchSupabaseHosts(), 'supabase.co'],
        provider: 'external-video-download',
        requireHostAllowlist: true,
      },
    )
    if (!videoResponse.ok) {
      return apiError(
        'VIDEO_DOWNLOAD_FAILED',
        `Error al descargar video: ${videoResponse.statusText}`,
        502,
      )
    }

    const videoBuffer = await videoResponse.arrayBuffer()
    await writeFile(filePath, Buffer.from(videoBuffer))

    const fileManager = new GoogleAIFileManager(googleApiKey)
    const uploadResult = await fileManager.uploadFile(filePath, {
      mimeType: 'video/mp4',
      displayName: 'Lesson Video',
    })

    const uploadName = uploadResult.file.name
    let file = await fileManager.getFile(uploadName)
    while (file.state === FileState.PROCESSING) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      file = await fileManager.getFile(uploadName)
    }
    if (file.state === FileState.FAILED) {
      return apiError(
        'GEMINI_PROCESSING_FAILED',
        'El procesamiento del video en Gemini falló.',
        502,
      )
    }

    // EXCEPCIÓN DELIBERADA AL GATEWAY DE IA: esta ruta usa la File API de Gemini
    // (`fileData` + `fileUri`), un flujo de subida y espera de procesamiento que
    // no tiene equivalente en el contrato neutral ni en OpenAI. Por eso el
    // propósito `video_processing` declara `supportedProviders: ['google']` y el
    // panel impide seleccionar otro proveedor: la restricción de la
    // configuración y la de este código dicen lo mismo.
    const videoSettings = await getAiModelSettings('video_processing')
    const genAI = new GoogleGenerativeAI(googleApiKey)
    const model = genAI.getGenerativeModel({
      model: videoSettings.model,
      generationConfig: buildManagedGenerationConfig(videoSettings, {
        // No administrable: la respuesta se parsea como JSON obligatoriamente.
        responseMimeType: 'application/json',
      }),
    })

    const prompt = `
      Actúa como un asistente educativo experto encargado de procesar material didáctico.

      Analiza el video y la pista de audio proporcionada EXHAUSTIVAMENTE.

      Debes generar un objeto JSON con tres campos obligatorios:

      1. "segments": La transcripción COMPLETA dividida en tramos CON MARCAS DE TIEMPO.
         - Cada tramo: { "start": <segundos>, "end": <segundos>, "text": "<lo que se dice>" }
         - "start" y "end" son NÚMEROS en SEGUNDOS desde el inicio del video (no texto, no "mm:ss").
         - Corta en unidades naturales de habla (una idea por tramo), de 10 a 30 segundos.
         - Los tramos van EN ORDEN y cubren el video completo, sin huecos ni solapamientos.
         - CRÍTICO: los tiempos deben ser REALES, tomados del audio. Nunca los estimes,
           inventes ni los repartas de forma uniforme: se usan para llevar al alumno al
           punto exacto del video y un tiempo inventado lo manda a otra parte.

      2. "summary": Un resumen educativo, rico y MUY BIEN ESTRUCTURADO.
         - EL FORMATO ES CRÍTICO: Usa Markdown para dar estructura visual.
         - Usa Títulos (###) para separar secciones (ej: Introducción, Conceptos Clave, Conclusión).
         - Usa **Negritas** para resaltar términos importantes.
         - Usa listas con viñetas (-) para enumerar características o pasos.
         - Debe ser un material de estudio listo para leer, no solo texto plano.

      3. "transcript": La transcripción completa como texto corrido, en párrafos
         separados por doble salto de línea (\\n\\n). Debe decir exactamente lo mismo
         que "segments", sin las marcas de tiempo.

      Respuesta JSON esperada:
      {
        "segments": [
          { "start": 0, "end": 14.2, "text": "Bienvenidos a esta leccion..." },
          { "start": 14.2, "end": 31.8, "text": "El primer concepto clave es..." }
        ],
        "summary": "### Introducción\\nTexto...\\n\\n### Puntos Clave\\n- Item 1\\n- Item 2",
        "transcript": "Párrafo 1...\\n\\nPárrafo 2..."
      }
    `

    const result = await executeWithCircuitBreaker(
      'gemini-process-video',
      () =>
        model.generateContent([
          { fileData: { mimeType: file.mimeType, fileUri: file.uri } },
          { text: prompt },
        ]),
      CIRCUIT_BREAKER_DEFAULTS.gemini,
    )

    const responseText = result.response.text()
    const data = JSON.parse(responseText)

    await fileManager.deleteFile(uploadName)
    await unlink(filePath)

    // Los segmentos se validan antes de devolverse: vienen de un modelo y un
    // `start` mal formado llevaría al alumno a un punto equivocado del video.
    const segments = parseTranscriptSegments(data.segments)

    return NextResponse.json({
      success: true,
      // Si el modelo no devolvió texto corrido utilizable, se reconstruye desde
      // los segmentos para que ambos campos digan siempre lo mismo.
      transcript:
        typeof data.transcript === 'string' && data.transcript.trim()
          ? data.transcript
          : buildPlainTranscript(segments),
      segments,
      summary: data.summary,
    })
  } catch (error) {
    logger.error('Error processing video', error)
    return apiError('PROCESS_VIDEO_FAILED', 'Error interno', 500)
  }
}

export const POST = withZodBody(processVideoSchema, handlePost)
