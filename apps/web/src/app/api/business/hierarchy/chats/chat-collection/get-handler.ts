import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { requireBusinessOrganization } from './auth'
import { getErrorDetails } from './error-details'
import { createHierarchyChatsErrorResponse, HierarchyChatsError } from './errors'
import { listHierarchyChats } from './list-chats'
import { parseListChatsParams } from './request-validation'
import { createServiceClient } from './service-client'

export async function handleListHierarchyChatsRequest(request: Request) {
  try {
    const auth = await requireBusinessOrganization()
    if (auth instanceof NextResponse) return auth

    const params = parseListChatsParams(request)
    const chats = await listHierarchyChats(createServiceClient(), auth, params)

    return NextResponse.json({ success: true, chats })
  } catch (error) {
    if (error instanceof HierarchyChatsError) {
      return createHierarchyChatsErrorResponse(error)
    }

    const errorDetails = getErrorDetails(error)
    logger.error('Error en GET /api/business/hierarchy/chats:', {
      error,
      message: errorDetails.message,
      stack: errorDetails.stack,
      name: errorDetails.name,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener chats',
        details: errorDetails.message || 'Error desconocido',
      },
      { status: 500 },
    )
  }
}
