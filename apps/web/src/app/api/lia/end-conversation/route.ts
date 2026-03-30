import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { LiaLogger } from '../../../../lib/analytics/lia-logger';

/**
 * POST /api/lia/end-conversation
 * 
 * Cierra una conversación con LIA y calcula métricas finales
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    // Obtener datos del body (puede venir de fetch o sendBeacon)
    let conversationId: string;
    let completed = true;
    
    try {
      const body = await request.json();
      conversationId = body.conversationId;
      completed = body.completed !== undefined ? body.completed : true;
    } catch {
      // Si falla el parsing JSON (por sendBeacon), intentar leer como texto
      const text = await request.text();
      const data = JSON.parse(text);
      conversationId = data.conversationId;
      completed = data.completed !== undefined ? data.completed : true;
    }

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId es requerido' },
        { status: 400 }
      );
    }

    // Crear logger y cerrar conversación
    const logger = new LiaLogger(user.id);
    logger.setConversationId(conversationId);
    await logger.endConversation(completed);

    return NextResponse.json({
      success: true,
      conversationId,
      completed,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al cerrar conversación' },
      { status: 500 }
    );
  }
}
