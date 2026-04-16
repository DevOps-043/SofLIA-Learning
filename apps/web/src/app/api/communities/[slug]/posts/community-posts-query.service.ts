import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommunityPostRequestBody {
  title?: string;
  content?: string;
  attachment_url?: string;
  attachment_type?: string;
  attachment_data?: Record<string, unknown> | string | null;
}

export interface GetPostsOptions {
  slug: string;
  limit: number;
  cursor: string | null;
  userId?: string;
}

export interface GetPostsResult {
  posts: Record<string, unknown>[];
  total: number;
  hasMore: boolean;
  nextCursor: string | null;
}

export type AccessCheckResult =
  | { allowed: true }
  | { allowed: false; status: 401 | 403; body: Record<string, unknown> };

export interface CreatePostOptions {
  slug: string;
  userId: string;
  userEmail?: string;
  body: CommunityPostRequestBody;
}

export interface CreatePostResult {
  post: Record<string, unknown>;
  success: true;
  aiModerationPending: true;
}

// ---------------------------------------------------------------------------
// Community lookup helpers
// ---------------------------------------------------------------------------

export async function getCommunityBySlug(
  supabase: SupabaseClient,
  slug: string
) {
  const { data, error } = await supabase
    .from('communities')
    .select('id, access_type, slug, member_count')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  return { community: data, error };
}

// ---------------------------------------------------------------------------
// Access-control check (GET)
// ---------------------------------------------------------------------------

export async function checkGetAccess(
  supabase: SupabaseClient,
  community: { id: string; access_type: string; slug: string },
  userId?: string
): Promise<AccessCheckResult> {
  if (community.access_type === 'invitation_only') {
    if (!userId) {
      logger.log('🔒 User not authenticated for private community');
      return {
        allowed: false,
        status: 401,
        body: {
          error: 'Debes iniciar sesión para ver esta comunidad',
          requires_auth: true,
        },
      };
    }

    const { data: membership } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', community.id)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (!membership) {
      logger.log('🔒 User not member of private community');
      return {
        allowed: false,
        status: 403,
        body: {
          error: 'No tienes acceso a esta comunidad',
          requires_membership: true,
        },
      };
    }
  } else if (community.slug === 'profesionales' && userId) {
    // Users who already belong to another community cannot access Profesionales
    const { data: allMemberships } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .neq('community_id', community.id);

    if (allMemberships && allMemberships.length > 0) {
      logger.log('🔒 User has other memberships: blocking access to Profesionales posts');
      return {
        allowed: false,
        status: 403,
        body: {
          error: 'Ya perteneces a otra comunidad',
          requires_membership: true,
        },
      };
    }

    logger.log('🔓 Free community: authenticated user has access to Profesionales');
  }

  return { allowed: true };
}

// ---------------------------------------------------------------------------
// Fetch posts with cursor-based pagination
// ---------------------------------------------------------------------------

export async function fetchPaginatedPosts(
  supabase: SupabaseClient,
  options: GetPostsOptions
): Promise<GetPostsResult> {
  const { slug, limit, cursor, userId } = options;

  // Resolve community id
  const { community, error: communityError } = await getCommunityBySlug(supabase, slug);
  if (communityError || !community) {
    throw Object.assign(new Error('Comunidad no encontrada'), { status: 404 });
  }

  let postsQuery = supabase
    .from('community_posts')
    .select(`
      *,
      user:user_id (
        id,
        username,
        first_name,
        last_name,
        profile_picture_url
      )
    `)
    .eq('community_id', community.id)
    .order('created_at', { ascending: false })
    .limit(limit + 1); // +1 to detect next page

  if (cursor) {
    const { data: cursorPost } = await supabase
      .from('community_posts')
      .select('created_at')
      .eq('id', cursor)
      .single();

    if (cursorPost) {
      postsQuery = postsQuery.lt('created_at', cursorPost.created_at);
    }
  }

  const { data: posts, error: postsError } = await postsQuery;

  if (postsError) {
    logger.error('❌ Error fetching posts:', postsError);
    throw Object.assign(new Error('Error al obtener posts'), { status: 500 });
  }

  logger.log('📊 Found posts:', posts?.length ?? 0);

  const attachmentTypes = posts?.map((p) => p.attachment_type).filter(Boolean);
  logger.log('🔍 Attachment types found:', [...new Set(attachmentTypes)]);

  // Batch-load user reactions (single query instead of N+1)
  let userReactionsMap: Record<string, string> = {};
  if (userId && posts && posts.length > 0) {
    const postIds = posts.map((post) => post.id);
    const { data: reactions } = await supabase
      .from('community_reactions')
      .select('post_id, reaction_type')
      .eq('user_id', userId)
      .in('post_id', postIds);

    if (reactions) {
      userReactionsMap = reactions.reduce<Record<string, string>>((acc, r) => {
        acc[r.post_id] = r.reaction_type;
        return acc;
      }, {});
    }
  }

  const enrichedPosts = (posts ?? []).map((post) => {
    const userReaction = userReactionsMap[post.id] ?? null;

    if (post.attachment_type === 'poll') {
      logger.log('✅ Poll post found with data:', {
        id: post.id,
        question: post.attachment_data?.question,
        options: post.attachment_data?.options,
        votes: post.attachment_data?.votes,
      });
    }

    return {
      ...post,
      user_has_liked: userReaction === 'like',
      user_reaction_type: userReaction,
    };
  });

  const hasMore = enrichedPosts.length > limit;
  const postsToReturn = hasMore ? enrichedPosts.slice(0, limit) : enrichedPosts;
  const nextCursor =
    hasMore && postsToReturn.length > 0
      ? postsToReturn[postsToReturn.length - 1].id
      : null;

  return {
    posts: postsToReturn,
    total: postsToReturn.length,
    hasMore,
    nextCursor,
  };
}

// ---------------------------------------------------------------------------
// Validate & sanitise POST body fields
// ---------------------------------------------------------------------------

export function validateAttachmentType(
  attachment_type: string | undefined
): string | null | undefined {
  const validAttachmentTypes = ['image', 'video', 'document', 'link', 'poll'];
  if (attachment_type && !validAttachmentTypes.includes(attachment_type)) {
    logger.warn('⚠️ Invalid attachment_type received:', attachment_type, 'Defaulting to null');
    return null;
  }
  return attachment_type;
}

export function validateAttachmentData(
  attachment_data: Record<string, unknown> | string | null | undefined
): Record<string, unknown> | null | undefined {
  if (!attachment_data) return attachment_data as null | undefined;

  try {
    if (typeof attachment_data === 'string') {
      return JSON.parse(attachment_data) as Record<string, unknown>;
    }
    if (typeof attachment_data !== 'object') {
      logger.warn(
        '⚠️ Invalid attachment_data type:',
        typeof attachment_data,
        'Defaulting to null'
      );
      return null;
    }
    // Ensure serialisable
    JSON.stringify(attachment_data);
    return attachment_data;
  } catch (error) {
    logger.error('❌ Error validating attachment_data:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Moderation – Layer 1 (keyword filter)
// ---------------------------------------------------------------------------

export async function runLayer1Moderation(
  supabase: SupabaseClient,
  content: string,
  userId: string
): Promise<
  | { blocked: false }
  | { blocked: true; status: 400 | 403; body: Record<string, unknown> }
> {
  const { containsForbiddenContent, registerWarning } = await import(
    '../../../../../lib/moderation'
  );

  const forbiddenCheck = await containsForbiddenContent(content, supabase);
  if (!forbiddenCheck.contains) return { blocked: false };

  try {
    const warningResult = await registerWarning(userId, content, 'post', supabase);

    if (warningResult.userBanned) {
      return {
        blocked: true,
        status: 403,
        body: {
          error:
            '❌ Has sido baneado del sistema por reiteradas violaciones de las reglas de la comunidad.',
          banned: true,
        },
      };
    }

    return {
      blocked: true,
      status: 400,
      body: {
        error: `⚠️ El contenido contiene lenguaje inapropiado y ha sido bloqueado. ${warningResult.message}`,
        warning: true,
        warningCount: warningResult.warningCount,
        foundWords: forbiddenCheck.words,
      },
    };
  } catch (error) {
    logger.error('Error registering warning:', error);
    return {
      blocked: true,
      status: 400,
      body: { error: 'El contenido contiene lenguaje inapropiado y ha sido bloqueado.' },
    };
  }
}

// ---------------------------------------------------------------------------
// Membership resolution
// ---------------------------------------------------------------------------

export async function resolveMembership(
  supabase: SupabaseClient,
  communityId: string,
  userId: string,
  userEmail: string | undefined,
  slug: string
): Promise<{ id: string } | null> {
  // Try by auth user id first
  const { data: directMembership } = await supabase
    .from('community_members')
    .select('id')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();

  if (directMembership) return directMembership;

  // Fall back to lookup by email in public.users
  if (userEmail) {
    const { data: userByEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (userByEmail) {
      const { data: emailMembership } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', communityId)
        .eq('user_id', userByEmail.id)
        .eq('is_active', true)
        .single();

      if (emailMembership) return emailMembership;
    }
  }

  // Special auto-join logic for "Profesionales"
  if (slug === 'profesionales') {
    return autoJoinProfesionales(supabase, communityId, userId);
  }

  return null;
}

async function autoJoinProfesionales(
  supabase: SupabaseClient,
  communityId: string,
  userId: string
): Promise<{ id: string } | null> {
  logger.log('🔓 Auto-creating membership for Profesionales community');

  const { data: allMemberships } = await supabase
    .from('community_members')
    .select('community_id, communities!inner(slug)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .neq('communities.slug', 'profesionales');

  if (allMemberships && allMemberships.length > 0) return null;

  const { data: newMembership, error: joinError } = await supabase
    .from('community_members')
    .insert({
      community_id: communityId,
      user_id: userId,
      role: 'member',
      joined_at: new Date().toISOString(),
      is_active: true,
    })
    .select('id')
    .single();

  if (joinError || !newMembership) {
    logger.error('❌ Error creating auto-membership:', joinError);
    return null;
  }

  logger.log('✅ Auto-membership created for Profesionales');

  // Increment member_count
  const { data: communityData } = await supabase
    .from('communities')
    .select('member_count')
    .eq('id', communityId)
    .single();

  if (communityData) {
    await supabase
      .from('communities')
      .update({
        member_count: (communityData.member_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', communityId);
  }

  return newMembership;
}

// ---------------------------------------------------------------------------
// Insert post
// ---------------------------------------------------------------------------

export async function insertCommunityPost(
  supabase: SupabaseClient,
  options: CreatePostOptions,
  communityId: string,
  validatedAttachmentType: string | null | undefined,
  validatedAttachmentData: Record<string, unknown> | null | undefined
) {
  const { userId, body } = options;
  const { title, content, attachment_url } = body;

  const postInsertData = {
    community_id: communityId,
    user_id: userId,
    title: title || null,
    content: content!.trim(),
    attachment_url: attachment_url || null,
    attachment_type: validatedAttachmentType || null,
    attachment_data: validatedAttachmentData || null,
    likes_count: 0,
    comment_count: 0,
    reaction_count: 0,
    is_pinned: false,
    is_edited: false,
  };

  logger.log('📝 Inserting post with data:', {
    community_id: postInsertData.community_id,
    user_id: postInsertData.user_id,
    has_attachment: !!postInsertData.attachment_url,
    attachment_type: postInsertData.attachment_type,
    has_attachment_data: !!postInsertData.attachment_data,
  });

  const { data: newPost, error: postError } = await supabase
    .from('community_posts')
    .insert(postInsertData)
    .select(`
      *,
      user:user_id (
        id,
        email,
        username,
        first_name,
        last_name,
        profile_picture_url
      )
    `)
    .single();

  if (postError) {
    logger.error('❌ Error creating post:', postError);
    logger.error('❌ Post data that failed:', {
      attachment_type: validatedAttachmentType,
      attachment_url: attachment_url ? attachment_url.substring(0, 100) : null,
      attachment_data_keys: body.attachment_data
        ? Object.keys(body.attachment_data)
        : null,
      attachment_data_preview: body.attachment_data
        ? JSON.stringify(body.attachment_data).substring(0, 500)
        : null,
      error_code: postError.code,
      error_message: postError.message,
      error_details: postError.details,
      error_hint: postError.hint,
    });

    throw Object.assign(new Error(postError.message || 'Error desconocido'), {
      status: 500,
      code: postError.code,
    });
  }

  return newPost;
}

// ---------------------------------------------------------------------------
// Moderation – Layer 2 (background AI analysis)
// ---------------------------------------------------------------------------

export function scheduleAIModeration(
  supabase: SupabaseClient,
  postId: string,
  content: string,
  userId: string
): void {
  (async () => {
    try {
      const { analyzeContentWithAI, logAIModerationAnalysis, shouldAutoBan } =
        await import('../../../../../lib/ai-moderation');
      const { getUserWarningsCount, registerWarning } = await import(
        '../../../../../lib/moderation'
      );

      logger.log('🤖 Starting AI moderation analysis for post:', postId);

      const aiResult = await analyzeContentWithAI(content, {
        contentType: 'post',
        userId,
        previousWarnings: await getUserWarningsCount(userId, supabase),
      });

      logger.log('🤖 AI Analysis Result:', {
        postId,
        isInappropriate: aiResult.isInappropriate,
        confidence: (aiResult.confidence * 100).toFixed(1) + '%',
        categories: aiResult.categories,
        requiresHumanReview: aiResult.requiresHumanReview,
      });

      await logAIModerationAnalysis(userId, 'post', postId, content, aiResult, supabase);

      if (aiResult.isInappropriate) {
        logger.log('🚨 Inappropriate content detected! Deleting post:', postId);

        const { error: deleteError } = await supabase
          .from('community_posts')
          .delete()
          .eq('id', postId);

        if (deleteError) {
          logger.error('❌ Error deleting flagged post:', deleteError);
        } else {
          logger.log('✅ Post deleted successfully:', postId);
        }

        const warningResult = await registerWarning(userId, content, 'post', supabase);

        logger.log('⚠️ Warning registered for user:', {
          userId,
          warningCount: warningResult.warningCount,
          userBanned: warningResult.userBanned,
        });

        if (warningResult.userBanned) {
          logger.log('🚫 User has been banned:', userId);
        }
      } else {
        logger.log('✅ Content approved by AI moderation:', postId);
      }
    } catch (error) {
      logger.error('❌ Error in background AI moderation:', error);
    }
  })();
}
