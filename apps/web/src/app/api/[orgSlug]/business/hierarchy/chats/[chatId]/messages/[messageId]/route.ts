import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

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
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { orgSlug, chatId, messageId } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'El contenido del mensaje es requerido' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data: existingMessage } = await supabase
      .from('hierarchy_chat_messages')
      .select('id, sender_id, chat_id, is_deleted')
      .eq('id', messageId)
      .eq('chat_id', chatId)
      .single();

    if (!existingMessage) {
      return NextResponse.json(
        { success: false, error: 'Mensaje no encontrado' },
        { status: 404 }
      );
    }

    if (existingMessage.sender_id !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Solo puedes editar tus propios mensajes' },
        { status: 403 }
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
      return NextResponse.json(
        { success: false, error: 'Error al actualizar el mensaje' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: updatedMessage
    });
  } catch (error) {
    logger.error('Error en PUT chat message:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar el mensaje' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/[orgSlug]/business/hierarchy/chats/[chatId]/messages/[messageId]
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { orgSlug, chatId, messageId } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      );
    }

    const supabase = createServiceClient();

    const { data: existingMessage } = await supabase
      .from('hierarchy_chat_messages')
      .select('id, sender_id, is_deleted')
      .eq('id', messageId)
      .eq('chat_id', chatId)
      .single();

    if (!existingMessage) {
      return NextResponse.json(
        { success: false, error: 'Mensaje no encontrado' },
        { status: 404 }
      );
    }

    if (existingMessage.sender_id !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Solo puedes eliminar tus propios mensajes' },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from('hierarchy_chat_messages')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Error al eliminar el mensaje' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mensaje eliminado correctamente'
    });
  } catch (error) {
    logger.error('Error en DELETE chat message:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar el mensaje' },
      { status: 500 }
    );
  }
}
