import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';
import { stripBugReportTokens } from '@/app/api/lia/chat/lia-report-workflow.service';

/**
 * GET /api/lia/conversations/[conversationId]/messages
 * Obtiene TODOS los mensajes de una conversación específica
 * IMPORTANTE: Retorna TODOS los mensajes para mantener contexto completo
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { conversationId } = await params;
    const supabase = await createClient();

    // Verificar que la conversación pertenece al usuario
    const { data: conversation, error: convError } = await supabase
      .from('lia_conversations')
      .select('conversation_id, user_id')
      .eq('conversation_id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversación no encontrada' },
        { status: 404 }
      );
    }

    if (conversation.user_id !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Obtener TODOS los mensajes de la conversación ordenados por sequence
    // IMPORTANTE: No limitar para mantener contexto completo
    const { data: messages, error } = await supabase
      .from('lia_messages')
      .select('message_id, role, content, created_at, message_sequence')
      .eq('conversation_id', conversationId)
      .order('message_sequence', { ascending: true });

    if (error) {
      console.error('Error obteniendo mensajes:', error);
      return NextResponse.json(
        { error: 'Error obteniendo mensajes' },
        { status: 500 }
      );
    }

    // Formatear mensajes para el frontend
    const formattedMessages = (messages || []).map((msg) => ({
      id: msg.message_id,
      role: msg.role,
      content:
        msg.role === 'assistant' ? stripBugReportTokens(msg.content) : msg.content,
      timestamp: new Date(msg.created_at || Date.now())
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error en API de mensajes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
