import { NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { SessionService } from '../../../features/auth/services/session.service';
import { fromLoose } from '../../../lib/supabase/looseQuery';

interface LiaConversationInsert {
  user_id: string;
  context_type: string;
  device_type: string;
  browser: string;
  ip_address: string;
}

interface LiaConversationRow extends LiaConversationInsert {
  conversation_id: string;
}

/**
 * Endpoint de prueba para verificar que LIA Analytics funciona
 * Accede a: /api/test-lia-db
 */
export async function GET() {
  try {
    // 1. Verificar usuario
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no autenticado',
        step: 'auth'
      }, { status: 401 });
    }

    // 2. Conectar a Supabase
    const supabase = await createClient();

    // 3. Intentar insertar en lia_conversations
    const testData: LiaConversationInsert = {
      user_id: user.id,
      context_type: 'test',
      device_type: 'test',
      browser: 'test-browser',
      ip_address: '127.0.0.1'
    };

    const liaConversations = fromLoose<LiaConversationRow, LiaConversationInsert>(supabase, 'lia_conversations');

    const { data, error } = await liaConversations
      .insert(testData)
      .select('conversation_id')
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
        step: 'insert',
        user: {
          id: user.id,
          username: user.username
        }
      }, { status: 500 });
    }

    // 4. Si llegamos aquí, funcionó
    const conversationId = data?.conversation_id;

    // 5. Verificar que se guardó
    const { data: checkData, error: checkError } = await liaConversations
      .select(SELECT_COLUMNS.lia_conversations)
      .eq('conversation_id', conversationId)
      .single();

    if (checkError) {
    }

    // 6. Limpiar (borrar el registro de prueba)
    await liaConversations
      .delete()
      .eq('conversation_id', conversationId);

    return NextResponse.json({
      success: true,
      message: '✅ LIA Analytics funciona correctamente',
      conversationId,
      user: {
        id: user.id,
        username: user.username
      },
      insertedData: testData,
      retrievedData: checkData
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined,
      step: 'general'
    }, { status: 500 });
  }
}
