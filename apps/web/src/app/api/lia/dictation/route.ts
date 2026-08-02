import { NextRequest, NextResponse } from 'next/server'

import { SessionService } from '@/features/auth/services/session.service'
import { generateAiText } from '@/lib/ai/providers/ai-text-gateway.server'
import { logger } from '@/lib/utils/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function getErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== 'object' || !('status' in error)) {
    return null
  }

  const { status } = error
  return typeof status === 'number' ? status : null
}

function getErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== 'object' || !('message' in error)) {
    return null
  }

  const { message } = error
  return typeof message === 'string' ? message : null
}

export async function POST(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado', success: false },
        { status: 401 },
      )
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    const language = formData.get('language') as string | null

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No se proporciono archivo de audio', success: false },
        { status: 400 },
      )
    }

    const maxSize = 25 * 1024 * 1024
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo de audio es demasiado grande. Maximo 25MB', success: false },
        { status: 400 },
      )
    }

    const allowedTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/webm',
      'audio/ogg',
      'audio/m4a',
      'audio/x-m4a',
      'audio/mp4',
    ]

    if (
      !allowedTypes.includes(audioFile.type) &&
      !audioFile.name.match(/\.(mp3|wav|webm|ogg|m4a|mp4)$/i)
    ) {
      return NextResponse.json(
        { error: 'Formato de audio no soportado. Use mp3, wav, webm, ogg, m4a o mp4', success: false },
        { status: 400 },
      )
    }

    const languageMap: Record<string, string> = {
      en: 'en',
      es: 'es',
      pt: 'pt',
    }
    const requestedLanguage = language && languageMap[language] ? languageMap[language] : 'es'
    const arrayBuffer = await audioFile.arrayBuffer()
    const audioBase64 = Buffer.from(arrayBuffer).toString('base64')

    logger.info('Iniciando transcripcion con Gemini', {
      fileName: audioFile.name,
      fileSize: audioFile.size,
      fileType: audioFile.type,
      language: requestedLanguage,
      userId: user.id,
    })

    const transcription = await generateAiText({
      circuitBreakerName: 'gemini-lia-dictation',
      purpose: 'lia_dictation',
      prompt: [
        {
          text:
            `Transcribe el audio en ${requestedLanguage}. ` +
            'Responde solo con el texto transcrito, sin explicaciones, etiquetas ni formato.',
          type: 'text',
        },
        {
          data: audioBase64,
          mimeType: audioFile.type || 'audio/mpeg',
          type: 'inlineData',
        },
      ],
    })

    return NextResponse.json({
      language: requestedLanguage,
      success: true,
      text: transcription.text,
    })
  } catch (error: unknown) {
    logger.error('Error en transcripcion de dictado:', error)

    if (getErrorStatus(error) === 401) {
      return NextResponse.json(
        { error: 'Error de autenticacion con el servicio de transcripcion', success: false },
        { status: 500 },
      )
    }

    if (getErrorStatus(error) === 413 || getErrorMessage(error)?.includes('too large')) {
      return NextResponse.json(
        { error: 'El archivo de audio es demasiado grande', success: false },
        { status: 400 },
      )
    }

    if (getErrorMessage(error)?.includes('Invalid file format')) {
      return NextResponse.json(
        { error: 'Formato de audio no valido', success: false },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        error: 'Error al transcribir audio',
        message: getErrorMessage(error) || 'Error desconocido',
        success: false,
      },
      { status: 500 },
    )
  }
}
