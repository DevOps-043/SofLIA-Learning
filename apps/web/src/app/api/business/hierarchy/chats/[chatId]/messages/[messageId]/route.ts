import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

import {
  chatMessageEditSchema,
  type ChatMessageEditBody,
} from '../../../../_schemas';

function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Configuración de Supabase incompleta');
  }
  return createSupabaseClient(supabaseUrl, supabaseServiceKey);
}

interface RouteParams {
  params: Promise<{ chatId: string; messageId: string }>;
}

async function handlePut(
  _request: NextRequest,
  body: ChatMessageEditBody,
  { params }: RouteParams,
) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organización asignada', 403);
    }

    const { chatId, messageId } = await params;
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

    if (existingMessage.is_deleted) {
      return apiError(
        'MESSAGE_DELETED',
        'No puedes editar un mensaje eliminado',
        400,
      );
    }

    const { data: updatedMessage, error: updateError } = await supabase
      .from('hierarchy_chat_messages')
      .update({
        content: content.trim(),
        is_edited: true,
        edited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select(
        `*, sender:users!hierarchy_chat_messages_sender_id_fkey(id, display_name, first_name, last_name, email, profile_picture_url)`,
      )
      .single();

    if (updateError || !updatedMessage) {
      logger.error('Error actualizando mensaje:', updateError);
      return apiError('UPDATE_MESSAGE_FAILED', 'Error al actualizar el mensaje', 500);
    }

    logger.info('Mensaje actualizado:', { messageId });
    return NextResponse.json({ success: true, message: updatedMessage });
  } catch (error) {
    logger.error('Error en PUT messages/[messageId]:', error);
    return apiError('UPDATE_MESSAGE_FAILED', 'Error al actualizar el mensaje', 500);
  }
}

export const PUT = withZodBody(chatMessageEditSchema, handlePut);

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organización asignada', 403);
    }

    const { chatId, messageId } = await params;
    const supabase = createServiceClient();

    const { data: existingMessage } = await supabase
      .from('hierarchy_chat_messages')
      .select('id, sender_id, is_deleted')
      .eq('id', messageId)
      .eq('chat_id', chatId)
      .single();

    if (!existingMessage) {
      return apiError('MESSAGE_NOT_FOUND', 'Mensaje no encontrado', 404);
    }

    if (existingMessage.sender_id !== auth.userId) {
      return apiError(
        'FORBIDDEN',
        'Solo puedes eliminar tus propios mensajes',
        403,
      );
    }

    if (existingMessage.is_deleted) {
      return apiError(
        'ALREADY_DELETED',
        'El mensaje ya está eliminado',
        400,
      );
    }

    const { error: deleteError } = await supabase
      .from('hierarchy_chat_messages')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', messageId);

    if (deleteError) {
      logger.error('Error eliminando mensaje:', deleteError);
      return apiError('DELETE_MESSAGE_FAILED', 'Error al eliminar el mensaje', 500);
    }

    logger.info('Mensaje eliminado:', { messageId });
    return NextResponse.json({
      success: true,
      message: 'Mensaje eliminado correctamente',
    });
  } catch (error) {
    logger.error('Error en DELETE messages/[messageId]:', error);
    return apiError('DELETE_MESSAGE_FAILED', 'Error al eliminar el mensaje', 500);
  }
}
