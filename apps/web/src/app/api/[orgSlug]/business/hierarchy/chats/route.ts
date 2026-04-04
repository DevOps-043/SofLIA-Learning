import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{ orgSlug: string }>;
}

type HierarchyEntityType = 'region' | 'zone' | 'team' | 'node';
type HierarchyChatType = 'horizontal' | 'vertical';

interface HierarchyChatRow {
  id: string;
  entity_type: HierarchyEntityType;
  entity_id: string;
  chat_type: HierarchyChatType;
  last_message_at?: string | null;
  is_active: boolean;
  [key: string]: unknown;
}

interface HierarchyChatParticipantRow {
  id: string;
  user_id: string;
  is_active: boolean;
  unread_count: number | null;
  last_read_at: string | null;
}

interface HierarchyParticipantUser {
  user_id: string;
}

function isHierarchyEntityType(value: string | null): value is HierarchyEntityType {
  return value === 'region' || value === 'zone' || value === 'team' || value === 'node';
}

function isHierarchyChatType(value: string | null): value is HierarchyChatType {
  return value === 'horizontal' || value === 'vertical';
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido';
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
 * GET /api/[orgSlug]/business/hierarchy/chats
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { orgSlug } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const entityTypeValue = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');
    const chatTypeValue = searchParams.get('chat_type');
    const chatType = isHierarchyChatType(chatTypeValue) ? chatTypeValue : null;

    if (!isHierarchyEntityType(entityTypeValue) || !entityId) {
      return NextResponse.json(
        { success: false, error: 'entity_type y entity_id son requeridos' },
        { status: 400 }
      );
    }
    const entityType = entityTypeValue;

    const supabase = createServiceClient();

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

    const { data: chats, error } = await baseQuery
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .returns<HierarchyChatRow[]>();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Error al obtener chats'
        },
        { status: 500 }
      );
    }

    const chatsWithCounts = await Promise.all(
      (chats || []).map(async (chat) => {
        const { data: participants } = await supabase
          .from('hierarchy_chat_participants')
          .select('id, user_id, is_active, unread_count, last_read_at')
          .eq('chat_id', chat.id)
          .eq('is_active', true)
          .returns<HierarchyChatParticipantRow[]>();

        const activeParticipants = participants || [];
        const userParticipant = activeParticipants.find((participant) => participant.user_id === auth.userId);

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
    logger.error('Error en GET chats:', error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/[orgSlug]/business/hierarchy/chats
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { orgSlug } = await params;
    const auth = await requireBusiness({ organizationSlug: orgSlug });
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

    const supabase = createServiceClient();

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
      return NextResponse.json({
        success: true,
        chat: existingChat,
        created: false
      });
    }

    let levelRole: string | null = null;
    if (chat_type === 'horizontal') {
      if (entity_type === 'region') levelRole = 'regional_manager';
      else if (entity_type === 'zone') levelRole = 'zone_manager';
      else if (entity_type === 'team') levelRole = 'team_leader';
    } else if (chat_type === 'vertical') {
      if (entity_type === 'region') levelRole = 'regional_manager';
      else if (entity_type === 'zone') levelRole = 'zone_manager';
      else if (entity_type === 'team') levelRole = 'team_leader';
      else if (entity_type === 'node') levelRole = 'node_manager';
    }

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
      return NextResponse.json(
        {
          success: false,
          error: 'Error al crear el chat'
        },
        { status: 500 }
      );
    }

    // Obtener participantes
    let participants: HierarchyParticipantUser[] = [];
    try {
      if (entity_type === 'node') {
        const { data } = await supabase.rpc('get_node_chat_participants', {
          p_node_id: entity_id,
          p_organization_id: auth.organizationId
        });
        participants = (data || []) as HierarchyParticipantUser[];
      } else {
        if (chat_type === 'horizontal') {
          const { data } = await supabase.rpc('get_horizontal_chat_participants', {
            p_entity_type: entity_type,
            p_entity_id: entity_id,
            p_organization_id: auth.organizationId
          });
          participants = (data || []) as HierarchyParticipantUser[];
        } else {
          const { data } = await supabase.rpc('get_vertical_chat_participants', {
            p_entity_type: entity_type,
            p_entity_id: entity_id,
            p_organization_id: auth.organizationId
          });
          participants = (data || []) as HierarchyParticipantUser[];
        }
      }
    } catch (e) {}

    const participantUserIds = new Set(participants.map(p => p.user_id));
    participantUserIds.add(auth.userId);

    const participantInserts = Array.from(participantUserIds).map(userId => ({
      chat_id: newChat.id,
      user_id: userId,
      organization_id: auth.organizationId,
      is_active: true,
      unread_count: 0
    }));

    if (participantInserts.length > 0) {
      await supabase
        .from('hierarchy_chat_participants')
        .insert(participantInserts);
    }

    return NextResponse.json({
      success: true,
      chat: newChat,
      created: true
    });
  } catch (error: unknown) {
    logger.error('Error en POST chats:', error);
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error)
      },
      { status: 500 }
    );
  }
}
