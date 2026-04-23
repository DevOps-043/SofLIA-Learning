import { NextRequest, NextResponse } from 'next/server'
import { formatApiError, logError } from '@/core/utils/api-errors'
import { handleGenerateNanoBananaRequest } from './nanobana-generation'

const MAX_PAYLOAD_BYTES = 32 * 1024 // 32 KB — sufficient for conversation history + message

export async function POST(request: NextRequest) {
  try {
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: 'Solicitud demasiado grande' }, { status: 413 })
    }

    const body = await request.json()
    const result = await handleGenerateNanoBananaRequest(body)
    return NextResponse.json(result.body, { status: result.status })
  } catch (error) {
    logError('POST /api/ai-directory/generate-nanobana', error)

    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(formatApiError(error, 'Error de configuracion de API'), { status: 500 })
    }

    if (error instanceof Error && error.message.includes('rate limit')) {
      return NextResponse.json(
        formatApiError(error, 'Limite de solicitudes excedido. Intentalo mas tarde.'),
        { status: 429 },
      )
    }

    return NextResponse.json(
      formatApiError(error, 'Error al generar esquema NanoBanana'),
      { status: 500 },
    )
  }
}
