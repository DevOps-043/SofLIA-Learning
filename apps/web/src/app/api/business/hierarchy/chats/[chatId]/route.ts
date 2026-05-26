import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';

// Crear cliente con service_role que bypasea RLS
function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Configuración de Supabase incompleta');
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey);
}

interface RouteParams {
  params: Promise<{ chatId: string }>;
}

/**
 * GET /api/business/hierarchy/chats/[chatId]
 * Obtiene un chat con sus mensajes y participantes
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      );
    }

    const { chatId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // ID del mensaje para paginación

    const supabase = createServiceClient();

    // Obtener el chat
    const { data: chat, error: chatError } = await supabase
      .from('hierarchy_chats')
      .select(SELECT_COLUMNS.hierarchy_chats)
      .eq('id', chatId)
      .eq('organization_id', auth.organizationId)
      .eq('is_active', true)
      .single();

    if (chatError || !chat) {
      return NextResponse.json(
        { success: false, error: 'Chat no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el usuario es participante
    const { data: participant } = await supabase
      .from('hierarchy_chat_participants')
      .select(SELECT_COLUMNS.hierarchy_chat_participants)
      .eq('chat_id', chatId)
      .eq('user_id', auth.userId)
      .eq('is_active', true)
      .single();

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'No tienes acceso a este chat' },
        { status: 403 }
      );
    }

    // Obtener mensajes
    let messagesQuery = supabase
      .from('hierarchy_chat_messages')
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
      .eq('chat_id', chatId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      // Paginación: obtener mensajes anteriores a este ID
      messagesQuery = messagesQuery.lt('id', before);
    }

    const { data: messages, error: messagesError } = await messagesQuery;

    if (messagesError) {
      logger.error('Error obteniendo mensajes:', messagesError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener mensajes' },
        { status: 500 }
      );
    }

    // Obtener participantes
    const { data: participants, error: participantsError } = await supabase
      .from('hierarchy_chat_participants')
      .select(`
        *,
        user:users!hierarchy_chat_participants_user_id_fkey(
          id,
          display_name,
          first_name,
          last_name,
          email,
          profile_picture_url
        )
      `)
      .eq('chat_id', chatId)
      .eq('is_active', true);

    if (participantsError) {
      logger.error('Error obteniendo participantes:', participantsError);
    }

    // Invertir orden de mensajes (más antiguos primero)
    const orderedMessages = (messages || []).reverse();

    return NextResponse.json({
      success: true,
      chat,
      messages: orderedMessages,
      participants: participants || [],
      has_more: (messages || []).length === limit
    });
  } catch (error) {
    logger.error('Error en GET /api/business/hierarchy/chats/[chatId]:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener el chat' },
      { status: 500 }
    );
  }
}

