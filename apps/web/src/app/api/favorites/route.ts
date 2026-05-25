import { NextRequest, NextResponse } from 'next/server'

import { formatApiError, logError } from '@/core/utils/api-errors'
import { FavoritesService } from '../../../features/courses/services/favorites.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { toggleFavoriteSchema, type ToggleFavoriteBody } from './schema'

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
async function handlePost(
  _request: NextRequest,
  body: ToggleFavoriteBody,
) {
  try {
    const { userId, courseId } = body

    const isFavorite = await FavoritesService.toggleFavorite(userId, courseId)
    const updatedFavorites = await FavoritesService.getUserFavorites(userId)

    return NextResponse.json({
      success: true,
      isFavorite,
      favorites: updatedFavorites,
      message: isFavorite ? 'Agregado a favoritos' : 'Removido de favoritos'
    })
  } catch (error) {
    logError('POST /api/favorites', error)
    return apiError('FAVORITE_TOGGLE_FAILED', 'Error al gestionar favoritos', 500)
  }
}

export const POST = withZodBody(toggleFavoriteSchema, handlePost)
