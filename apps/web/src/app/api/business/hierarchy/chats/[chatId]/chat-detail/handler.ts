import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { requireBusinessOrganization } from '../../chat-collection/auth'
import { fetchActiveChat, assertChatParticipant } from '../../chat-collection/chat-access'
import {
  createHierarchyChatsErrorResponse,
  HierarchyChatsError,
} from '../../chat-collection/errors'
import { createServiceClient } from '../../chat-collection/service-client'
import { fetchChatMessages, fetchChatParticipants } from './queries'

export async function handleGetHierarchyChatRequest(
  request: Request,
  params: Promise<{ chatId: string }>,
) {
  try {
    const auth = await requireBusinessOrganization()
    if (auth instanceof NextResponse) return auth

    const { chatId } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before')
    const supabase = createServiceClient()

    const chat = await fetchActiveChat(supabase, chatId, auth.organizationId)
    await assertChatParticipant(supabase, chatId, auth.userId)

    const messages = await fetchChatMessages(supabase, chatId, limit, before)
    const participants = await fetchChatParticipants(supabase, chatId)

    return NextResponse.json({
      success: true,
      chat,
      messages,
      participants,
      has_more: messages.length === limit,
    })
  } catch (error) {
    if (error instanceof HierarchyChatsError) {
      return createHierarchyChatsErrorResponse(error)
    }

    logger.error('Error en GET /api/business/hierarchy/chats/[chatId]:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener el chat' },
      { status: 500 },
    )
  }
}
