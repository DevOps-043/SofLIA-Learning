import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

import { chatReadSchema, type ChatReadBody } from '../../../_schemas';

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

async function handlePost(
  _request: NextRequest,
  body: ChatReadBody,
  { params }: RouteParams,
) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return apiError('NO_ORGANIZATION', 'No tienes una organización asignada', 403);
    }

    const { chatId } = await params;
    const supabase = createServiceClient();

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

    const readAt = body.last_read_at || new Date().toISOString();
    const { error: updateError } = await supabase
      .from('hierarchy_chat_participants')
      .update({
        last_read_at: readAt,
        unread_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', participant.id);

    if (updateError) {
      logger.error('Error marcando mensajes como leídos:', updateError);
      return apiError(
        'MARK_READ_FAILED',
        'Error al marcar mensajes como leídos',
        500,
      );
    }

    return NextResponse.json({ success: true, message: 'Mensajes marcados como leídos' });
  } catch (error) {
    logger.error(
      'Error en POST /api/business/hierarchy/chats/[chatId]/read:',
      error,
    );
    return apiError(
      'MARK_READ_FAILED',
      'Error al marcar mensajes como leídos',
      500,
    );
  }
}

export const POST = withZodBody(chatReadSchema, handlePost);
