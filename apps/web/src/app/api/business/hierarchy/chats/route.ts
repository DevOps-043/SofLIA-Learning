import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

interface HierarchyChatRow {
  id: string;
  last_message_at?: string | null;
}

interface HierarchyChatParticipantRow {
  id?: string;
  user_id: string;
  is_active?: boolean;
  unread_count?: number | null;
  last_read_at?: string | null;
}

interface HierarchyChatRpcParticipant {
  user_id: string;
}

type ErrorWithDetails = {
  message?: string;
  stack?: string;
  name?: string;
};

function getErrorDetails(error: unknown): ErrorWithDetails {
  if (error && typeof error === 'object') {
    return error as ErrorWithDetails;
  }

  return {};
}

// Crear cliente con service_role que bypasea RLS
// Necesario porque el proyecto usa autenticación personalizada, no Supabase Auth
function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Configuración de Supabase incompleta. Verifica NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey);
}

/**
 * GET /api/business/hierarchy/chats
 * Lista los chats de una entidad (región, zona o equipo)
 * Query params: entity_type, entity_id, chat_type (opcional)
 */
export async function GET(request: Request) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type') as 'region' | 'zone' | 'team' | 'node' | null;
    const entityId = searchParams.get('entity_id');
    const chatType = searchParams.get('chat_type') as 'horizontal' | 'vertical' | null;

    if (!entityType || !entityId) {
      return NextResponse.json(
        { success: false, error: 'entity_type y entity_id son requeridos' },
        { status: 400 }
      );
    }

    if (!['region', 'zone', 'team', 'node'].includes(entityType)) {
      return NextResponse.json(
        { success: false, error: 'entity_type debe ser region, zone, team o node' },
        { status: 400 }
      );
    }

    // Usar service client que bypasea RLS (necesario porque usamos auth personalizada)
    const supabase = createServiceClient();

    // Construir query - primero obtener chats sin participantes para evitar errores
    let baseQuery = supabase
      .from('hierarchy_chats')
      .select('*')
      .eq('organization_id', auth.organizationId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('is_active', true);

    if (chatType) {
      baseQuery = baseQuery.eq('chat_type', chatType);
    }

    const { data: chats, error } = await baseQuery.order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
      logger.error('Error obteniendo chats:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });

      // Si la tabla no existe, dar mensaje más claro
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Las tablas de chat no están disponibles. Por favor, ejecuta la migración de base de datos.',
            details: error.message
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener chats',
          details: error.message || 'Error desconocido'
        },
        { status: 500 }
      );
    }

    // Obtener participantes para cada chat
    const chatsWithCounts = await Promise.all(
      ((chats as HierarchyChatRow[] | null) || []).map(async (chat) => {
        // Obtener participantes del chat
        const { data: participants } = await supabase
          .from('hierarchy_chat_participants')
          .select('id, user_id, is_active, unread_count, last_read_at')
          .eq('chat_id', chat.id)
          .eq('is_active', true);

        const activeParticipants = (participants as HierarchyChatParticipantRow[] | null) || [];
        const userParticipant = activeParticipants.find((p) => p.user_id === auth.userId);

        return {
          ...chat,
          participants_count: activeParticipants.length,
          unread_count: userParticipant?.unread_count || 0
        };
      })
    );

    return NextResponse.json({
      success: true,
      chats: chatsWithCounts
    });
  } catch (error: unknown) {
    const errorDetails = getErrorDetails(error);
    logger.error('Error en GET /api/business/hierarchy/chats:', {
      error,
      message: errorDetails.message,
      stack: errorDetails.stack,
      name: errorDetails.name
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener chats',
        details: errorDetails.message || 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/business/hierarchy/chats
 * Crea o obtiene un chat existente para una entidad
 */
export async function POST(request: Request) {
  try {
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { entity_type, entity_id, chat_type, name, description } = body;

    if (!entity_type || !entity_id || !chat_type) {
      return NextResponse.json(
        { success: false, error: 'entity_type, entity_id y chat_type son requeridos' },
        { status: 400 }
      );
    }

    if (!['region', 'zone', 'team', 'node'].includes(entity_type)) {
      return NextResponse.json(
        { success: false, error: 'entity_type debe ser region, zone, team o node' },
        { status: 400 }
      );
    }

    if (!['horizontal', 'vertical'].includes(chat_type)) {
      return NextResponse.json(
        { success: false, error: 'chat_type debe ser horizontal o vertical' },
        { status: 400 }
      );
    }

    // Usar service client que bypasea RLS (necesario porque usamos auth personalizada)
    const supabase = createServiceClient();

    // Verificar que la entidad existe y pertenece a la organización
    let entityExists = false;
    if (entity_type === 'region') {
      const { data } = await supabase
        .from('organization_regions')
        .select('id')
        .eq('id', entity_id)
        .eq('organization_id', auth.organizationId)
        .single();
      entityExists = !!data;
    } else if (entity_type === 'zone') {
      const { data } = await supabase
        .from('organization_zones')
        .select('id')
        .eq('id', entity_id)
        .eq('organization_id', auth.organizationId)
        .single();
      entityExists = !!data;
    } else if (entity_type === 'team') {
      const { data } = await supabase
        .from('organization_teams')
        .select('id')
        .eq('id', entity_id)
        .eq('organization_id', auth.organizationId)
        .single();
      entityExists = !!data;
    } else if (entity_type === 'node') {
      const { data } = await supabase.from('organization_nodes').select('id').eq('id', entity_id).eq('organization_id', auth.organizationId).single();
      entityExists = !!data;
    }

    if (!entityExists) {
      return NextResponse.json(
        { success: false, error: 'La entidad especificada no existe' },
        { status: 404 }
      );
    }

    // Intentar obtener chat existente
    const { data: existingChat } = await supabase
      .from('hierarchy_chats')
      .select('*')
      .eq('organization_id', auth.organizationId)
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id)
      .eq('chat_type', chat_type)
      .eq('is_active', true)
      .single();

    if (existingChat) {
      // Chat ya existe, retornarlo
      return NextResponse.json({
        success: true,
        chat: existingChat,
        created: false
      });
    }

    // Determinar level_role basado en entity_type y chat_type
    let levelRole: string | null = null;
    if (chat_type === 'horizontal') {
      if (entity_type === 'region') levelRole = 'regional_manager';
      else if (entity_type === 'zone') levelRole = 'zone_manager';
      else if (entity_type === 'team') levelRole = 'team_leader';
      // 'node' no tiene soporte horizontal por ahora (por user request)
    } else if (chat_type === 'vertical') {
      if (entity_type === 'region') levelRole = 'regional_manager';
      else if (entity_type === 'zone') levelRole = 'zone_manager';
      else if (entity_type === 'team') levelRole = 'team_leader';
      else if (entity_type === 'node') levelRole = 'node_manager';
    }

    // Crear nuevo chat
    const { data: newChat, error: createError } = await supabase
      .from('hierarchy_chats')
      .insert({
        organization_id: auth.organizationId,
        entity_type,
        entity_id,
        chat_type,
        level_role: levelRole,
        name: name || null,
        description: description || null,
        is_active: true
      })
      .select()
      .single();

    if (createError || !newChat) {
      logger.error('Error creando chat:', {
        error: createError,
        message: createError?.message,
        details: createError?.details,
        hint: createError?.hint,
        code: createError?.code
      });

      // Si la tabla no existe, dar mensaje más claro
      if (createError?.code === '42P01' || createError?.message?.includes('does not exist')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Las tablas de chat no están disponibles. Por favor, ejecuta la migración de base de datos.',
            details: createError?.message
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Error al crear el chat',
          details: createError?.message || 'Error desconocido'
        },
        { status: 500 }
      );
    }

    // Obtener participantes según el tipo de chat
    let participants: HierarchyChatRpcParticipant[] = [];
    try {
      if (entity_type === 'node') {
        // Usar nueva lógica para nodos
        const { data, error: rpcError } = await supabase.rpc('get_node_chat_participants', {
          p_node_id: entity_id,
          p_organization_id: auth.organizationId
        });
        if (rpcError) throw rpcError;
        participants = data || [];
      } else {
        // Lógica legacy para entidades antiguas
        if (chat_type === 'horizontal') {
          const { data, error: rpcError } = await supabase.rpc('get_horizontal_chat_participants', {
            p_entity_type: entity_type,
            p_entity_id: entity_id,
            p_organization_id: auth.organizationId
          });
          if (rpcError) throw rpcError;
          participants = data || [];
        } else {
          const { data, error: rpcError } = await supabase.rpc('get_vertical_chat_participants', {
            p_entity_type: entity_type,
            p_entity_id: entity_id,
            p_organization_id: auth.organizationId
          });
          if (rpcError) throw rpcError;
          participants = data || [];
        }
      }
    } catch (rpcException: unknown) {
      logger.error('Excepción al llamar funciones RPC de chat:', rpcException);
      console.error(rpcException)
      // Continuar sin participantes (solo el usuario actual será agregado abajo)
    }

    // Agregar participantes al chat
    // IMPORTANTE: Siempre agregar al usuario actual como participante, incluso si no hay otros participantes
    const participantUserIds = new Set(participants.map(p => p.user_id));

    // Asegurar que el usuario actual esté incluido
    if (!participantUserIds.has(auth.userId)) {
      participantUserIds.add(auth.userId);
    }

    // Crear inserts para todos los participantes
    const participantInserts = Array.from(participantUserIds).map(userId => ({
      chat_id: newChat.id,
      user_id: userId,
      organization_id: auth.organizationId,
      is_active: true,
      unread_count: 0
    }));

    // Insertar todos los participantes
    if (participantInserts.length > 0) {
      const { error: insertError } = await supabase
        .from('hierarchy_chat_participants')
        .insert(participantInserts);

      if (insertError) {
        logger.error('Error insertando participantes:', insertError);
        // Si falla la inserción de participantes, intentar al menos agregar el usuario actual
        await supabase
          .from('hierarchy_chat_participants')
          .insert({
            chat_id: newChat.id,
            user_id: auth.userId,
            organization_id: auth.organizationId,
            is_active: true,
            unread_count: 0
          })
          .select()
          .single();
      }
    } else {
      // Si no hay participantes de la función RPC, al menos agregar el usuario actual
      await supabase
        .from('hierarchy_chat_participants')
        .insert({
          chat_id: newChat.id,
          user_id: auth.userId,
          organization_id: auth.organizationId,
          is_active: true,
          unread_count: 0
        });
    }

    logger.info('Chat creado:', { chatId: newChat.id, entity_type, entity_id, chat_type });

    return NextResponse.json({
      success: true,
      chat: newChat,
      created: true
    });
  } catch (error: unknown) {
    const errorDetails = getErrorDetails(error);
    logger.error('Error en POST /api/business/hierarchy/chats:', {
      error,
      message: errorDetails.message,
      stack: errorDetails.stack
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Error al crear el chat',
        details: errorDetails.message || 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
