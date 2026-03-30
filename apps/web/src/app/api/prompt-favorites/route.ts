import { NextRequest, NextResponse } from 'next/server'
import { PromptFavoritesService } from '../../../features/ai-directory/services/prompt-favorites.service'
import { SessionService } from '../../../features/auth/services/session.service'
import { formatApiError, logError } from '@/core/utils/api-errors'

// GET - Obtener favoritos de prompts de un usuario
export async function GET(request: NextRequest) {
  try {
    const currentUser = await SessionService.getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const favorites = await PromptFavoritesService.getUserPromptFavorites(currentUser.id)
    return NextResponse.json({
      success: true,
      favorites
    })
  } catch (error) {
    logError('GET /api/prompt-favorites', error)
    return NextResponse.json(
      formatApiError(error, 'Error al obtener favoritos de prompts'),
      { status: 500 }
    )
  }
}

// POST - Agregar/remover favorito de prompt
export async function POST(request: NextRequest) {
  try {
    const currentUser = await SessionService.getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { promptId } = body

    if (!promptId) {
      return NextResponse.json(
        { error: 'promptId es requerido' },
        { status: 400 }
      )
    }

    const isFavorite = await PromptFavoritesService.togglePromptFavorite(currentUser.id, promptId)

    return NextResponse.json({
      success: true,
      isFavorite,
      message: isFavorite ? 'Agregado a favoritos' : 'Removido de favoritos'
    })
  } catch (error) {
    logError('POST /api/prompt-favorites', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      formatApiError(error, 'Error al gestionar favoritos de prompts'),
      { status: 500 }
    )
  }
}

