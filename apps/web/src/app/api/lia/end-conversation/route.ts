import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { createClient } from '../../../../lib/supabase/server';
import { LiaLogger } from '../../../../lib/analytics/lia-logger';
import { endConversationSchema, type EndConversationBody } from '../_schemas';

/**
 * POST /api/lia/end-conversation
 * 
 * Cierra una conversación con LIA y calcula métricas finales
 */
async function handlePost(
  _request: NextRequest,
  body: EndConversationBody,
  _context: unknown,
) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiError('UNAUTHORIZED', 'No autorizado', 401);
    }

    const { conversationId, completed } = body;

    // Crear logger y cerrar conversación
    const logger = new LiaLogger(user.id);
    logger.setConversationId(conversationId);
    await logger.endConversation(completed);

    return NextResponse.json({
      success: true,
      conversationId,
      completed,
    });
  } catch {
    return apiError(
      'END_CONVERSATION_FAILED',
      'Error al cerrar conversación',
      500,
    );
  }
}

export const POST = withZodBody(endConversationSchema, handlePost);
