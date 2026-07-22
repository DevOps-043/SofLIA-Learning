import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import os from 'os'

import { getAiModelSettings } from '@/lib/ai/model-settings/ai-model-settings.server.service'
import { buildManagedGenerationConfig } from '@/lib/ai/model-settings/generation-config'
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
        allowedHosts: getSafeFetchSupabaseHosts(),
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

      Debes generar un objeto JSON con dos campos obligatorios:

      1. "transcript": La transcripción COMPLETA de todo lo que se dice en el video.
         - IMPORTANTE: No devuelvas un solo bloque masivo de texto.
         - Divide el texto en párrafos lógicos y legibles usando doble salto de línea (\\n\\n).
         - La lectura debe ser fluida y natural visualmente.

      2. "summary": Un resumen educativo, rico y MUY BIEN ESTRUCTURADO.
         - EL FORMATO ES CRÍTICO: Usa Markdown para dar estructura visual.
         - Usa Títulos (###) para separar secciones (ej: Introducción, Conceptos Clave, Conclusión).
         - Usa **Negritas** para resaltar términos importantes.
         - Usa listas con viñetas (-) para enumerar características o pasos.
         - Debe ser un material de estudio listo para leer, no solo texto plano.

      Respuesta JSON esperada:
      {
        "transcript": "Párrafo 1...\\n\\nPárrafo 2...",
        "summary": "### Introducción\\nTexto...\\n\\n### Puntos Clave\\n- Item 1\\n- Item 2"
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

    return NextResponse.json({
      success: true,
      transcript: data.transcript,
      summary: data.summary,
    })
  } catch (error) {
    logger.error('Error processing video', error)
    return apiError('PROCESS_VIDEO_FAILED', 'Error interno', 500)
  }
}

export const POST = withZodBody(processVideoSchema, handlePost)
