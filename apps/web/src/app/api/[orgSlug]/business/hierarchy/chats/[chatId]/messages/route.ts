import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import {
  chatMessageSchema,
  type ChatMessageBody,
} from '@/app/api/business/hierarchy/_schemas';

interface RouteContext {
  params: Promise<{ orgSlug: string; chatId: string }>;
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
 * POST /api/[orgSlug]/business/hierarchy/chats/[chatId]/messages
 */
async function handlePost(
  _request: NextRequest,
  body: ChatMessageBody,
  { params }: RouteContext,
) {
  try {
    const { orgSlug, chatId } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organización asignada', 403);
    }

    const { content, message_type = 'text', metadata } = body;

    const supabase = createServiceClient();

    const { data: chat } = await supabase
      .from('hierarchy_chats')
      .select('id, organization_id')
      .eq('id', chatId)
      .eq('organization_id', auth.organizationId)
      .eq('is_active', true)
      .single();

    if (!chat) {
      return apiError('CHAT_NOT_FOUND', 'Chat no encontrado', 404);
    }

    const { data: participant } = await supabase
      .from('hierarchy_chat_participants')
      .select('id')
      .eq('chat_id', chatId)
      .eq('user_id', auth.userId)
      .eq('is_active', true)
      .single();

    if (!participant) {
      return apiError('CHAT_FORBIDDEN', 'No tienes acceso a este chat', 403);
    }

    const { data: message, error: messageError } = await supabase
      .from('hierarchy_chat_messages')
      .insert({
        chat_id: chatId,
        organization_id: auth.organizationId,
        sender_id: auth.userId,
        content: content.trim(),
        message_type: message_type || 'text',
        metadata: metadata || {}
      })
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

    if (messageError || !message) {
      return apiError('SEND_MESSAGE_FAILED', 'Error al enviar el mensaje', 500);
    }

    return NextResponse.json({
      success: true,
      message
    });
  } catch (error) {
    logger.error('Error en POST chat messages:', error);
    return apiError('SEND_MESSAGE_FAILED', 'Error al enviar el mensaje', 500);
  }
}

export const POST = withZodBody(chatMessageSchema, handlePost);
