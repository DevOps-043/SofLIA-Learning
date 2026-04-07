import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import {
  CommunityPostRequestBody,
  checkGetAccess,
  fetchPaginatedPosts,
  getCommunityBySlug,
  insertCommunityPost,
  resolveMembership,
  runLayer1Moderation,
  scheduleAIModeration,
  validateAttachmentData,
  validateAttachmentType,
} from './community-posts-query.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 50);
    const cursor = searchParams.get('cursor');

    logger.log('🔍 Fetching posts for community slug:', slug, { limit, cursor });

    const { SessionService } = await import('../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    if (!user) {
      logger.log('⚠️ User not authenticated');
    } else {
      logger.log('✅ User authenticated:', user.id);
    }

    const { community, error: communityError } = await getCommunityBySlug(supabase, slug);
    if (communityError || !community) {
      logger.error('❌ Community not found:', communityError);
      return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });
    }

    const access = await checkGetAccess(supabase, community, user?.id);
    if (!access.allowed) {
      return NextResponse.json(access.body, { status: access.status });
    }

    const result = await fetchPaginatedPosts(supabase, {
      slug,
      limit,
      cursor,
      userId: user?.id,
    });

    const { withCache, dynamicCache } = await import('../../../../../core/utils/cache-headers');
    return withCache(NextResponse.json(result), dynamicCache);

  } catch (error) {
    logger.error('❌ Error in posts API:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;

    const { SessionService } = await import('../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    let requestBody: CommunityPostRequestBody;
    try {
      requestBody = await request.json();
    } catch (jsonError) {
      logger.error('❌ Error parsing request body:', jsonError);
      return NextResponse.json(
        { error: 'Error al procesar los datos del post', details: 'El cuerpo de la petición no es un JSON válido' },
        { status: 400 }
      );
    }

    const { content, attachment_type, attachment_data } = requestBody;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'El contenido es requerido' }, { status: 400 });
    }

    const layer1 = await runLayer1Moderation(supabase, content, user.id);
    if (layer1.blocked) {
      return NextResponse.json(layer1.body, { status: layer1.status });
    }

    const { community, error: communityError } = await getCommunityBySlug(supabase, slug);
    if (communityError || !community) {
      return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });
    }

    const membership = await resolveMembership(supabase, community.id, user.id, user.email, slug);
    if (!membership) {
      return NextResponse.json({ error: 'Debes ser miembro para crear posts' }, { status: 403 });
    }

    const validatedAttachmentType = validateAttachmentType(attachment_type);
    const validatedAttachmentData = validateAttachmentData(attachment_data);

    let newPost: Record<string, unknown>;
    try {
      newPost = await insertCommunityPost(
        supabase,
        { slug, userId: user.id, userEmail: user.email, body: requestBody },
        community.id,
        validatedAttachmentType,
        validatedAttachmentData
      );
    } catch (err) {
      const e = err as Error & { code?: string };
      return NextResponse.json(
        { error: 'Error al crear el post', details: e.message, code: e.code },
        { status: 500 }
      );
    }

    logger.log('✅ Post created successfully:', newPost.id);

    scheduleAIModeration(supabase, newPost.id as string, content, user.id);

    return NextResponse.json({ post: newPost, success: true, aiModerationPending: true });

  } catch (error) {
    logger.error('❌ Error in create post API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const errorDetails =
      error instanceof Error && process.env.NODE_ENV === 'development'
        ? { stack: error.stack }
        : undefined;

    return NextResponse.json(
      { error: 'Error al crear el post', details: errorMessage, ...errorDetails },
      { status: 500 }
    );
  }
}
