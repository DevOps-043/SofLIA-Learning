import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { requireBusinessOrganization } from './auth'
import { createHierarchyChatRecord, findExistingHierarchyChat } from './chat-records'
import { assertHierarchyEntityExists } from './entity-existence'
import { getErrorDetails } from './error-details'
import { createHierarchyChatsErrorResponse, HierarchyChatsError } from './errors'
import { insertHierarchyChatParticipants } from './participants-insert'
import { fetchHierarchyChatParticipants } from './participants-rpc'
import { parseCreateChatPayload } from './request-validation'
import { createServiceClient } from './service-client'

export async function handleCreateHierarchyChatRequest(request: Request) {
  try {
    const auth = await requireBusinessOrganization()
    if (auth instanceof NextResponse) return auth

    const payload = await parseCreateChatPayload(request)
    const supabase = createServiceClient()
    await assertHierarchyEntityExists(supabase, payload, auth.organizationId)

    const existingChat = await findExistingHierarchyChat(supabase, auth, payload)
    if (existingChat) {
      return NextResponse.json({ success: true, chat: existingChat, created: false })
    }

    const newChat = await createHierarchyChatRecord(supabase, auth, payload)
    const participants = await fetchHierarchyChatParticipants(
      supabase,
      payload,
      auth.organizationId,
    )
    await insertHierarchyChatParticipants(supabase, newChat.id, auth, participants)

    logger.info('Chat creado:', {
      chatId: newChat.id,
      entity_type: payload.entity_type,
      entity_id: payload.entity_id,
      chat_type: payload.chat_type,
    })

    return NextResponse.json({ success: true, chat: newChat, created: true })
  } catch (error) {
    if (error instanceof HierarchyChatsError) {
      return createHierarchyChatsErrorResponse(error)
    }

    const errorDetails = getErrorDetails(error)
    logger.error('Error en POST /api/business/hierarchy/chats:', {
      error,
      message: errorDetails.message,
      stack: errorDetails.stack,
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Error al crear el chat',
        details: errorDetails.message || 'Error desconocido',
      },
      { status: 500 },
    )
  }
}
