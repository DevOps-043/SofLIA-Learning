import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

/**
 * PATCH /api/lia/conversations/[conversationId]
 * Actualiza el título de una conversación
 * 
 * Body: { conversation_title: string }
 */
export async function PATCH(
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
    const { conversation_title } = await request.json();

    if (typeof conversation_title !== 'string' && conversation_title !== null) {
      return NextResponse.json(
        { error: 'conversation_title debe ser una cadena de texto o null' },
        { status: 400 }
      );
    }

    // Validar longitud máxima
    if (conversation_title && conversation_title.length > 255) {
      return NextResponse.json(
        { error: 'El título no puede exceder 255 caracteres' },
        { status: 400 }
      );
    }

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

    // Actualizar el título
    // Si conversation_title no existe en la BD, retornar error informativo
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };
    
    // Solo agregar conversation_title si la columna existe
    // Si no existe, el usuario debe ejecutar la migración primero
    if (conversation_title !== undefined) {
      updatePayload.conversation_title = conversation_title || null;
    }

    const { data: updatedConversation, error: updateError } = await supabase
      .from('lia_conversations')
      .update(updatePayload)
      .eq('conversation_id', conversationId)
      .select('conversation_id')
      .single();

    if (updateError) {
      techDebtLogger.error('Error actualizando conversación:', updateError);
      
      // Si el error es por columna no encontrada
      if (updateError.message?.includes('conversation_title') || updateError.message?.includes('column') || updateError.code === '42703') {
        return NextResponse.json(
          { error: 'La columna conversation_title no existe aún. Ejecuta la migración SQL primero.' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Error actualizando conversación' },
        { status: 500 }
      );
    }

    // Intentar obtener conversation_title si existe
    let finalTitle = null;
    try {
      const { data: convWithTitle } = await supabase
        .from('lia_conversations')
        .select('conversation_title')
        .eq('conversation_id', conversationId)
        .single();
      
      if (convWithTitle && 'conversation_title' in convWithTitle) {
        finalTitle = convWithTitle.conversation_title;
      }
    } catch {
      // Si conversation_title no existe, usar null
      finalTitle = null;
    }

    return NextResponse.json({ 
      conversation_id: updatedConversation.conversation_id,
      conversation_title: finalTitle
    });
  } catch (error) {
    techDebtLogger.error('Error en API de actualización:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lia/conversations/[conversationId]
 * Elimina una conversación y todos sus mensajes
 * IMPORTANTE: Elimina en cascada primero los mensajes, luego la conversación
 */
export async function DELETE(
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

    // Eliminar primero los mensajes (debido a la foreign key)
    const { error: messagesError } = await supabase
      .from('lia_messages')
      .delete()
      .eq('conversation_id', conversationId);

    if (messagesError) {
      techDebtLogger.error('Error eliminando mensajes:', messagesError);
      return NextResponse.json(
        { error: 'Error eliminando mensajes de la conversación' },
        { status: 500 }
      );
    }

    // Eliminar la conversación
    const { error: deleteError } = await supabase
      .from('lia_conversations')
      .delete()
      .eq('conversation_id', conversationId);

    if (deleteError) {
      techDebtLogger.error('Error eliminando conversación:', deleteError);
      return NextResponse.json(
        { error: 'Error eliminando conversación' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Conversación eliminada correctamente'
    });
  } catch (error) {
    techDebtLogger.error('Error en API de eliminación:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

