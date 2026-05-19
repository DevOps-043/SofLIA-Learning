import { NextRequest, NextResponse } from 'next/server';

import {
  createCommunityPostSchema,
  type CreateCommunityPostBody,
} from '@/app/api/communities/_schemas';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { sanitizePost } from '@/lib/sanitize/html-sanitizer.shortcuts';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

import {
  getCommunityBySlug,
  insertCommunityPost,
  resolveMembership,
  runLayer1Moderation,
  scheduleAIModeration,
  validateAttachmentData,
  validateAttachmentType,
} from './community-posts-query.service';

type RouteContext = { params: Promise<{ slug: string }> };

async function handlePost(
  _request: NextRequest,
  body: CreateCommunityPostBody,
  { params }: RouteContext,
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;

    const { SessionService } = await import('../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return apiError('UNAUTHORIZED', 'No autorizado', 401);
    }

    const { content, attachment_type, attachment_data } = body;
    const sanitizedContent = sanitizePost(content).trim();
    const requestBody: CreateCommunityPostBody = {
      ...body,
      content: sanitizedContent,
    };

    if (sanitizedContent.length === 0) {
      return apiError('CONTENT_REQUIRED', 'El contenido es requerido', 400);
    }

    const layer1 = await runLayer1Moderation(supabase, sanitizedContent, user.id);
    if (layer1.blocked) {
      return NextResponse.json(layer1.body, { status: layer1.status });
    }

    const { community, error: communityError } = await getCommunityBySlug(supabase, slug);
    if (communityError || !community) {
      return apiError('COMMUNITY_NOT_FOUND', 'Comunidad no encontrada', 404);
    }

    const membership = await resolveMembership(supabase, community.id, user.id, user.email, slug);
    if (!membership) {
      return apiError('COMMUNITY_MEMBERSHIP_REQUIRED', 'Debes ser miembro para crear posts', 403);
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
        validatedAttachmentData,
      );
    } catch (err) {
      const e = err as Error & { code?: string };
      logger.error('Error creating post:', { message: e.message, code: e.code });
      return apiError('CREATE_POST_FAILED', 'Error al crear el post', 500);
    }

    logger.log('Post created successfully:', newPost.id);

    scheduleAIModeration(supabase, newPost.id as string, sanitizedContent, user.id);

    return NextResponse.json({ post: newPost, success: true, aiModerationPending: true });
  } catch (error) {
    logger.error('Error in create post API:', error);
    return apiError('CREATE_POST_FAILED', 'Error al crear el post', 500);
  }
}

export const POST = withZodBody(createCommunityPostSchema, handlePost);
