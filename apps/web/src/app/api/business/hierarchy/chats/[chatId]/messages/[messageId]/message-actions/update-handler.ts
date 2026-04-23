import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { requireBusinessOrganization } from '../../../../chat-collection/auth'
import {
  createHierarchyChatsErrorResponse,
  HierarchyChatsError,
} from '../../../../chat-collection/errors'
import { readMessageBody } from '../../../../chat-collection/message-content'
import { createServiceClient } from '../../../../chat-collection/service-client'
import { fetchOwnedMessage } from './message-guards'
import { updateHierarchyChatMessage } from './update-message'

export async function handleUpdateHierarchyChatMessageRequest(
  request: Request,
  params: Promise<{ chatId: string; messageId: string }>,
) {
  try {
    const auth = await requireBusinessOrganization()
    if (auth instanceof NextResponse) return auth

    const { chatId, messageId } = await params
    const { content } = await readMessageBody(request)
    const supabase = createServiceClient()

    await fetchOwnedMessage(supabase, chatId, messageId, auth.userId, {
      ownMessageError: 'Solo puedes editar tus propios mensajes',
      deletedMessageError: 'No puedes editar un mensaje eliminado',
    })

    const message = await updateHierarchyChatMessage(supabase, messageId, content)
    logger.info('Mensaje actualizado:', { messageId })

    return NextResponse.json({ success: true, message })
  } catch (error) {
    if (error instanceof HierarchyChatsError) {
      return createHierarchyChatsErrorResponse(error)
    }

    logger.error('Error en PUT /api/business/hierarchy/chats/[chatId]/messages/[messageId]:', error)
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el mensaje' },
      { status: 500 },
    )
  }
}
