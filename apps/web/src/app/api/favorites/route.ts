import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { FavoritesService } from '../../../features/courses/services/favorites.service'
import { formatApiError, logError } from '@/core/utils/api-errors'

const ToggleFavoriteSchema = z.object({
  userId: z.string().uuid('userId debe ser un UUID válido'),
  courseId: z.string().uuid('courseId debe ser un UUID válido'),
})

// GET - Obtener favoritos de un usuario
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      )
    }

    const favorites = await FavoritesService.getUserFavorites(userId)

    // ⚡ Cache 30s - favoritos cambian ocasionalmente
    const { withCache, semiStaticCache } = await import('@/core/utils/cache-headers')
    return withCache(
      NextResponse.json(favorites),
      semiStaticCache
    )
  } catch (error) {
    logError('GET /api/favorites', error)
    return NextResponse.json(
      formatApiError(error, 'Error al obtener favoritos'),
      { status: 500 }
    )
  }
}

// POST - Agregar/remover favorito
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = ToggleFavoriteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.format() },
        { status: 400 }
      )
    }
    const { userId, courseId } = parsed.data

    const isFavorite = await FavoritesService.toggleFavorite(userId, courseId)
    
    // Obtener la lista actualizada de favoritos para sincronizar el estado
    const updatedFavorites = await FavoritesService.getUserFavorites(userId)

    return NextResponse.json({
      success: true,
      isFavorite,
      favorites: updatedFavorites, // Incluir lista actualizada
      message: isFavorite ? 'Agregado a favoritos' : 'Removido de favoritos'
    })
  } catch (error) {
    logError('POST /api/favorites', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      {
        error: 'Error al gestionar favoritos',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}
