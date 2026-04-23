import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { requireBusinessOrganization } from '../../../../chat-collection/auth'
import {
  createHierarchyChatsErrorResponse,
  HierarchyChatsError,
} from '../../../../chat-collection/errors'
import { createServiceClient } from '../../../../chat-collection/service-client'
import { deleteHierarchyChatMessage } from './delete-message'
import { fetchOwnedMessage } from './message-guards'

export async function handleDeleteHierarchyChatMessageRequest(
  params: Promise<{ chatId: string; messageId: string }>,
) {
  try {
    const auth = await requireBusinessOrganization()
    if (auth instanceof NextResponse) return auth

    const { chatId, messageId } = await params
    const supabase = createServiceClient()
    await fetchOwnedMessage(supabase, chatId, messageId, auth.userId, {
      ownMessageError: 'Solo puedes eliminar tus propios mensajes',
      deletedMessageError: 'El mensaje ya está eliminado',
    })

    await deleteHierarchyChatMessage(supabase, messageId)
    logger.info('Mensaje eliminado:', { messageId })

    return NextResponse.json({
      success: true,
      message: 'Mensaje eliminado correctamente',
    })
  } catch (error) {
    if (error instanceof HierarchyChatsError) {
      return createHierarchyChatsErrorResponse(error)
    }

    logger.error('Error en DELETE /api/business/hierarchy/chats/[chatId]/messages/[messageId]:', error)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar el mensaje' },
      { status: 500 },
    )
  }
}
