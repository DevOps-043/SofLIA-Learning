import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { provider, videoIdOrUrl } = await request.json()

    if (!provider || !videoIdOrUrl) {
      return NextResponse.json(
        { error: 'Provider y videoIdOrUrl son requeridos' },
        { status: 400 }
      )
    }

    let duration: number | null = null

    if (provider === 'youtube') {
      // Extraer video ID
      let videoId = videoIdOrUrl
      if (videoIdOrUrl.includes('youtube.com') || videoIdOrUrl.includes('youtu.be')) {
        const match = videoIdOrUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
        if (match && match[1]) {
          videoId = match[1]
        }
      }

      if (videoId) {
        // Intentar obtener duración usando oEmbed (no requiere API key, pero no devuelve duración)
        // Usar una API pública alternativa o simplemente devolver null
        // Por ahora, devolvemos null y el usuario puede ingresar la duración manualmente
        // O puedes usar una biblioteca o servicio de terceros
        duration = null
      }
    } else if (provider === 'vimeo') {
      // Extraer video ID
      let videoId = videoIdOrUrl
      if (videoIdOrUrl.includes('vimeo.com')) {
        const match = videoIdOrUrl.match(/vimeo\.com\/(\d+)/)
        if (match && match[1]) {
          videoId = match[1]
        }
      }

      if (videoId) {
        // Usar oEmbed API de Vimeo (no requiere API key)
        try {
          const oembedUrl = `https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`
          const response = await fetch(oembedUrl)
          
          if (response.ok) {
            const data = await response.json()
            if (data && data.duration) {
              duration = Math.floor(data.duration)
            }
          }
        } catch (error) {
        }
      }
    } else if (provider === 'custom') {
      // Para URLs personalizadas, intentar obtener duración desde el servidor
      // Esto puede no funcionar debido a CORS, pero intentamos
      duration = null // Por ahora, no podemos obtener duración de URLs personalizadas desde el servidor
    }

    return NextResponse.json({ duration })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al detectar duración del video' },
      { status: 500 }
    )
  }
}

