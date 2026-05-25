import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { withZodBody } from '@/lib/api/with-validation';
import { logger } from '@/lib/utils/logger';
import { addChatParticipants, createHierarchyChat, findExistingHierarchyChat, listHierarchyChats } from './hierarchy-chats/chat-queries';
import { hierarchyEntityExists } from './hierarchy-chats/entity-queries';
import { createServiceClient } from './hierarchy-chats/service-client';
import { getErrorDetails, jsonError, missingChatTablesError } from './hierarchy-chats/responses';
import { parseCreateChatBody, parseListChatsParams } from './hierarchy-chats/validation';

const chatBodySchema = z.record(z.unknown());
type ChatBodyShape = z.infer<typeof chatBodySchema>;

export async function GET(request: NextRequest) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;
    if (!auth.organizationId) {
      return jsonError('No tienes una organización asignada', 403);
    }

    const params = parseListChatsParams(new URL(request.url).searchParams);
    if ('error' in params) return params.error;

    const supabase = createServiceClient();
    const { chats, error } = await listHierarchyChats({
      auth,
      chatType: params.chatType,
      entityId: params.entityId,
      entityType: params.entityType,
      supabase,
    });

    if (error) return missingChatTablesError(error, 'Error al obtener chats');
    return NextResponse.json({ success: true, chats });
  } catch (error: unknown) {
    const errorDetails = getErrorDetails(error);
    logger.error('Error en GET /api/business/hierarchy/chats:', {
      error,
      message: errorDetails.message,
      stack: errorDetails.stack,
      name: errorDetails.name,
    });
    return jsonError('Error al obtener chats', 500, errorDetails.message);
  }
}

async function handlePost(_request: NextRequest, rawBody: ChatBodyShape) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;
    if (!auth.organizationId) {
      return jsonError('No tienes una organización asignada', 403);
    }

    const parsedBody = parseCreateChatBody(rawBody);
    if ('error' in parsedBody) return parsedBody.error;

    const supabase = createServiceClient();
    const existingChat = await findExistingHierarchyChat({ auth, supabase, ...parsedBody });
    if (existingChat) {
      return NextResponse.json({ success: true, chat: existingChat, created: false });
    }

    if (!await hierarchyEntityExists({ auth, supabase, ...parsedBody })) {
      return jsonError('La entidad especificada no existe', 404);
    }

    const { chat, error } = await createHierarchyChat({ auth, supabase, ...parsedBody });
    if (error || !chat) return missingChatTablesError(error, 'Error al crear el chat');

    await addChatParticipants({ auth, chatId: chat.id, supabase, ...parsedBody });
    logger.info('Chat creado:', {
      chatId: chat.id,
      entity_type: parsedBody.entity_type,
      entity_id: parsedBody.entity_id,
      chat_type: parsedBody.chat_type,
    });

    return NextResponse.json({ success: true, chat, created: true });
  } catch (error: unknown) {
    const errorDetails = getErrorDetails(error);
    logger.error('Error en POST /api/business/hierarchy/chats:', {
      error,
      message: errorDetails.message,
      stack: errorDetails.stack,
    });
    return jsonError('Error al crear el chat', 500, errorDetails.message);
  }
}

export const POST = withZodBody(chatBodySchema, handlePost);
