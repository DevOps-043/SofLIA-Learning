import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { LiaLogger } from '../../../../lib/analytics/lia-logger';

/**
 * POST /api/lia/feedback
 * 
 * Registra feedback del usuario sobre una respuesta de LIA
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verificar autenticación
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener datos del body
    const { messageId, feedbackType, rating, comment } = await request.json();

    if (!messageId || !feedbackType) {
      return NextResponse.json(
        { error: 'messageId y feedbackType son requeridos' },
        { status: 400 }
      );
    }

    // Validar feedbackType
    const validTypes = ['helpful', 'not_helpful', 'incorrect', 'confusing'];
    if (!validTypes.includes(feedbackType)) {
      return NextResponse.json(
        { error: 'feedbackType inválido' },
        { status: 400 }
      );
    }

    // Crear logger y registrar feedback
    const logger = new LiaLogger(user.id);
    await logger.logFeedback(messageId, feedbackType, rating, comment);

    return NextResponse.json({
      success: true,
      messageId,
      feedbackType,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al registrar feedback' },
      { status: 500 }
    );
  }
}
