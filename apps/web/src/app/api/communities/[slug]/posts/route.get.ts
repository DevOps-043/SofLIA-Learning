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
