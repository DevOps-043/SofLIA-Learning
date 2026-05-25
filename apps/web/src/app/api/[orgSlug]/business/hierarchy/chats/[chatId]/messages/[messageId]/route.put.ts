import { NextRequest, NextResponse } from 'next/server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { requireBusiness } from '@/lib/auth/requireBusiness';

import { logger } from '@/lib/utils/logger';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import {
  chatMessageEditSchema,
  type ChatMessageEditBody,
} from '@/app/api/business/hierarchy/_schemas';

interface RouteContext {
  params: Promise<{ orgSlug: string; chatId: string; messageId: string }>;
}

function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Configuración de Supabase incompleta');
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey);
}

/**
 * PUT /api/[orgSlug]/business/hierarchy/chats/[chatId]/messages/[messageId]
 */
async function handlePut(
  _request: NextRequest,
  body: ChatMessageEditBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug, chatId, messageId } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organización asignada', 403);
    }

    const { content } = body;

    const supabase = createServiceClient();

    const { data: existingMessage } = await supabase
      .from('hierarchy_chat_messages')
      .select('id, sender_id, chat_id, is_deleted')
      .eq('id', messageId)
      .eq('chat_id', chatId)
      .single();

    if (!existingMessage) {
      return apiError('MESSAGE_NOT_FOUND', 'Mensaje no encontrado', 404);
    }

    if (existingMessage.sender_id !== auth.userId) {
      return apiError(
        'FORBIDDEN',
        'Solo puedes editar tus propios mensajes',
        403,
      );
    }

    const { data: updatedMessage, error: updateError } = await supabase
      .from('hierarchy_chat_messages')
      .update({
        content: content.trim(),
        is_edited: true,
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select(`
        *,
        sender:users!hierarchy_chat_messages_sender_id_fkey(
          id,
          display_name,
          first_name,
          last_name,
          email,
          profile_picture_url
        )
      `)
      .single();

    if (updateError || !updatedMessage) {
      return apiError('UPDATE_MESSAGE_FAILED', 'Error al actualizar el mensaje', 500);
    }

    return NextResponse.json({
      success: true,
      message: updatedMessage
    });
  } catch (error) {
    logger.error('Error en PUT chat message:', error);
    return apiError('UPDATE_MESSAGE_FAILED', 'Error al actualizar el mensaje', 500);
  }
}

export const PUT = withZodBody(chatMessageEditSchema, handlePut);
