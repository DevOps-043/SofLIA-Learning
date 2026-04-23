import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { requireBusinessOrganization } from '../../../chat-collection/auth'
import { fetchActiveChat, assertChatParticipant } from '../../../chat-collection/chat-access'
import {
  createHierarchyChatsErrorResponse,
  HierarchyChatsError,
} from '../../../chat-collection/errors'
import { readMessageBody } from '../../../chat-collection/message-content'
import { createServiceClient } from '../../../chat-collection/service-client'
import { createChatMessage } from './create-message'

export async function handleCreateHierarchyChatMessageRequest(
  request: Request,
  params: Promise<{ chatId: string }>,
) {
  try {
    const auth = await requireBusinessOrganization()
    if (auth instanceof NextResponse) return auth

    const { chatId } = await params
    const { body, content } = await readMessageBody(request)
    const supabase = createServiceClient()

    await fetchActiveChat(supabase, chatId, auth.organizationId)
    await assertChatParticipant(supabase, chatId, auth.userId)

    const message = await createChatMessage(supabase, chatId, auth, content, body)
    logger.info('Mensaje enviado:', { chatId, messageId: message.id })

    return NextResponse.json({ success: true, message })
  } catch (error) {
    if (error instanceof HierarchyChatsError) {
      return createHierarchyChatsErrorResponse(error)
    }

    logger.error('Error en POST /api/business/hierarchy/chats/[chatId]/messages:', error)
    return NextResponse.json(
      { success: false, error: 'Error al enviar el mensaje' },
      { status: 500 },
    )
  }
}
