import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Noticia no encontrada' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { 
          error: 'Error al obtener noticia',
          message: error.message
        },
        { status: 500 }
      )
    }

    // Procesar métricas si están disponibles
    const newsWithMetrics = {
      ...data,
      view_count: data.metrics?.views || 0,
      comment_count: data.metrics?.comments || 0
    }

    return NextResponse.json(newsWithMetrics)
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
