import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cacheHeaders } from '@/lib/utils/cache-headers';
import { logger } from '@/lib/utils/logger';

interface CommunityPostRequestBody {
  title?: string
  content?: string
  attachment_url?: string
  attachment_type?: string
  attachment_data?: Record<string, unknown> | string | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;
    const { searchParams } = new URL(request.url);

    // Paginación con límite y cursor
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 50); // Max 50
    const cursor = searchParams.get('cursor'); // ID del último post visto

    logger.log('🔍 Fetching posts for community slug:', slug, { limit, cursor });
    
    // Obtener el usuario actual usando el sistema de sesiones personalizado
    const { SessionService } = await import('../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      logger.log('⚠️ User not authenticated');
    } else {
      logger.log('✅ User authenticated:', user.id);
    }

    // Primero obtener la comunidad por slug
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id, access_type')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (communityError || !community) {
      logger.error('❌ Community not found:', communityError);
      return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });
    }



    // Verificar acceso según el tipo de comunidad
    if (community.access_type === 'invitation_only') {
      if (!user) {
        logger.log('🔒 User not authenticated for private community');
        return NextResponse.json({ 
          error: 'Debes iniciar sesión para ver esta comunidad',
          requires_auth: true 
        }, { status: 401 });
      }

      const { data: membership } = await supabase
        .from('community_members')
        .select('id')
        .eq('community_id', community.id)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!membership) {
        logger.log('🔒 User not member of private community');
        return NextResponse.json({ 
          error: 'No tienes acceso a esta comunidad',
          requires_membership: true 
        }, { status: 403 });
      }
    } else if (community.slug === 'profesionales') {
      // Lógica especial para Profesionales
      if (!user) {
        logger.log('🔓 Free community: user not authenticated, showing limited content');
        // Permitir ver posts pero no crear
      } else {
        // Verificar si el usuario tiene membresía en OTRAS comunidades (excluir Profesionales)
        const { data: allMemberships } = await supabase
          .from('community_members')
          .select('community_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .neq('community_id', community.id); // Excluir la membresía de Profesionales misma

        const hasOtherMemberships = allMemberships && allMemberships.length > 0;
        
        if (hasOtherMemberships) {
          logger.log('🔒 User has other memberships: blocking access to Profesionales posts');
          return NextResponse.json({ 
            error: 'Ya perteneces a otra comunidad',
            requires_membership: true 
          }, { status: 403 });
        } else {
          logger.log('🔓 Free community: authenticated user has access to Profesionales');
        }
      }
    }

    // Obtener posts de la comunidad con paginación cursor-based
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
      .limit(limit + 1); // +1 para saber si hay más páginas

    // Si hay cursor, filtrar posts anteriores al cursor
    if (cursor) {
      // Obtener el created_at del post cursor
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
      return NextResponse.json({ error: 'Error al obtener posts' }, { status: 500 });
    }

    logger.log('📊 Found posts:', posts?.length || 0);
    
    // Debug: ver todos los attachment_types
    const attachmentTypes = posts?.map(p => p.attachment_type).filter(Boolean);
    logger.log('🔍 Attachment types found:', [...new Set(attachmentTypes)]);

    // ✅ OPTIMIZACIÓN: Obtener TODAS las reacciones del usuario en 1 sola query
    let userReactionsMap: Record<string, string> = {};
    if (user && posts && posts.length > 0) {
      const postIds = posts.map(post => post.id);
      const { data: reactions } = await supabase
        .from('community_reactions')
        .select('post_id, reaction_type')
        .eq('user_id', user.id)
        .in('post_id', postIds);

      // Crear mapa para acceso O(1)
      if (reactions) {
        userReactionsMap = reactions.reduce((acc, r) => {
          acc[r.post_id] = r.reaction_type;
          return acc;
        }, {} as Record<string, string>);
      }
    }

    // Enriquecer posts con información del usuario
    const enrichedPosts = posts?.map(post => {
      const userReaction = userReactionsMap[post.id] || null;
      
      // Debug: verificar datos de encuestas
      if (post.attachment_type === 'poll') {
        logger.log('✅ Poll post found with data:', {
          id: post.id,
          question: post.attachment_data?.question,
          options: post.attachment_data?.options,
          votes: post.attachment_data?.votes
        });
      }
      
      return {
        ...post,
        user_has_liked: userReaction === 'like',
        user_reaction_type: userReaction
      };
    }) || [];

    // Determinar si hay más páginas
    const hasMore = enrichedPosts.length > limit;
    const postsToReturn = hasMore ? enrichedPosts.slice(0, limit) : enrichedPosts;
    const nextCursor = hasMore && postsToReturn.length > 0
      ? postsToReturn[postsToReturn.length - 1].id
      : null;

    // Importar utilidades de cache
    const { withCache, dynamicCache } = await import('../../../../../core/utils/cache-headers');

    return withCache(
      NextResponse.json({
        posts: postsToReturn,
        total: postsToReturn.length,
        hasMore,
        nextCursor
      }),
      dynamicCache // Cache 30 seg - posts cambian frecuentemente
    );

  } catch (error) {
    logger.error('❌ Error in posts API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;
    
    // Obtener el usuario actual usando el sistema de sesiones personalizado
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
      return NextResponse.json({ 
        error: 'Error al procesar los datos del post',
        details: 'El cuerpo de la petición no es un JSON válido'
      }, { status: 400 });
    }

    const { title, content, attachment_url, attachment_type, attachment_data } = requestBody;

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'El contenido es requerido' }, { status: 400 });
    }

    // Validar que attachment_type sea uno de los valores permitidos en la BD
    const validAttachmentTypes = ['image', 'video', 'document', 'link', 'poll'];
    let validatedAttachmentType = attachment_type;
    
    if (attachment_type && !validAttachmentTypes.includes(attachment_type)) {
      logger.warn('⚠️ Invalid attachment_type received:', attachment_type, 'Defaulting to null');
      validatedAttachmentType = null;
    }

    // Validar y limpiar attachment_data si existe
    let validatedAttachmentData = attachment_data;
    if (attachment_data) {
      try {
        // Asegurarse de que attachment_data sea un objeto válido
        if (typeof attachment_data === 'string') {
          validatedAttachmentData = JSON.parse(attachment_data);
        } else if (typeof attachment_data !== 'object') {
          logger.warn('⚠️ Invalid attachment_data type:', typeof attachment_data, 'Defaulting to null');
          validatedAttachmentData = null;
        } else {
          // Validar que sea serializable
          JSON.stringify(attachment_data);
        }
      } catch (error) {
        logger.error('❌ Error validating attachment_data:', error);
        validatedAttachmentData = null;
      }
    }

    // ⭐ MODERACIÓN CAPA 1: Verificar si contiene palabras prohibidas
    const { containsForbiddenContent, registerWarning, getUserWarningsCount } = await import('../../../../../lib/moderation');
    const forbiddenCheck = await containsForbiddenContent(content, supabase);

    if (forbiddenCheck.contains) {
      try {
        const warningResult = await registerWarning(
          user.id,
          content,
          'post',
          supabase
        );
        
        // Si el usuario fue baneado
        if (warningResult.userBanned) {
          return NextResponse.json(
            { 
              error: '❌ Has sido baneado del sistema por reiteradas violaciones de las reglas de la comunidad.',
              banned: true
            },
            { status: 403 }
          );
        }
        
        // Si solo es advertencia
        return NextResponse.json(
          { 
            error: `⚠️ El contenido contiene lenguaje inapropiado y ha sido bloqueado. ${warningResult.message}`,
            warning: true,
            warningCount: warningResult.warningCount,
            foundWords: forbiddenCheck.words
          },
          { status: 400 }
        );
      } catch (error) {
        logger.error('Error registering warning:', error);
        // Si falla el registro, al menos bloquear el contenido
        return NextResponse.json(
          { error: 'El contenido contiene lenguaje inapropiado y ha sido bloqueado.' },
          { status: 400 }
        );
      }
    }

    // Obtener la comunidad por slug
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (communityError || !community) {
      return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });
    }

    // Verificar que el usuario es miembro
    // Buscar por ID directo primero, luego por email si no encuentra
    let membership = null;
    
    // Intentar con el ID directo de auth.users
    const { data: directMembership } = await supabase
      .from('community_members')
      .select('id')
      .eq('community_id', community.id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    
    if (directMembership) {
      membership = directMembership;
    } else {
      // Si no encuentra con el ID directo, buscar por email en public.users
      const { data: userByEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();
      
      if (userByEmail) {
        const { data: emailMembership } = await supabase
          .from('community_members')
          .select('id')
          .eq('community_id', community.id)
          .eq('user_id', userByEmail.id)
          .eq('is_active', true)
          .single();
        
        membership = emailMembership;
      }
    }

    // Lógica especial para "Profesionales": crear membresía automática si no existe
    if (!membership && slug === 'profesionales') {
      logger.log('🔓 Auto-creating membership for Profesionales community');
      
      // Verificar que el usuario no tenga otras membresías (excluyendo Profesionales)
      const { data: allMemberships } = await supabase
        .from('community_members')
        .select('community_id, communities!inner(slug)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .neq('communities.slug', 'profesionales');
      
      if (!allMemberships || allMemberships.length === 0) {
        // Crear membresía automática
        const { data: newMembership, error: joinError } = await supabase
          .from('community_members')
          .insert({
            community_id: community.id,
            user_id: user.id,
            role: 'member',
            joined_at: new Date().toISOString(),
            is_active: true
          })
          .select('id')
          .single();

        if (!joinError && newMembership) {
          membership = newMembership;
          logger.log('✅ Auto-membership created for Profesionales');
          
          // Obtener el contador actual y actualizarlo
          const { data: communityData } = await supabase
            .from('communities')
            .select('member_count')
            .eq('id', community.id)
            .single();
          
          if (communityData) {
            await supabase
              .from('communities')
              .update({ 
                member_count: (communityData.member_count || 0) + 1,
                updated_at: new Date().toISOString()
              })
              .eq('id', community.id);
          }
        } else {
          logger.error('❌ Error creating auto-membership:', joinError);
        }
      }
    }

    if (!membership) {
      return NextResponse.json({ 
        error: 'Debes ser miembro para crear posts' 
      }, { status: 403 });
    }

    // Preparar datos para insertar
    const postInsertData = {
      community_id: community.id,
      user_id: user.id,
      title: title || null,
      content: content.trim(),
      attachment_url: attachment_url || null,
      attachment_type: validatedAttachmentType || null,
      attachment_data: validatedAttachmentData || null,
      likes_count: 0,
      comment_count: 0,
      reaction_count: 0,
      is_pinned: false,
      is_edited: false
    };

    logger.log('📝 Inserting post with data:', {
      community_id: postInsertData.community_id,
      user_id: postInsertData.user_id,
      has_attachment: !!postInsertData.attachment_url,
      attachment_type: postInsertData.attachment_type,
      has_attachment_data: !!postInsertData.attachment_data
    });

    // Crear el post
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
        attachment_data_keys: attachment_data ? Object.keys(attachment_data) : null,
        attachment_data_preview: attachment_data ? JSON.stringify(attachment_data).substring(0, 500) : null,
        error_code: postError.code,
        error_message: postError.message,
        error_details: postError.details,
        error_hint: postError.hint,
        has_slug: !!postSlug
      });


      return NextResponse.json({ 
        error: 'Error al crear el post',
        details: postError.message || 'Error desconocido',
        code: postError.code
      }, { status: 500 });
    }

    logger.log('✅ Post created successfully:', newPost.id);

    // ⭐ MODERACIÓN CAPA 2: Análisis con IA DESPUÉS de crear el post
    // Este análisis se ejecuta en background sin bloquear la respuesta
    (async () => {
      try {
        const { 
          analyzeContentWithAI, 
          logAIModerationAnalysis,
          shouldAutoBan 
        } = await import('../../../../../lib/ai-moderation');
        
        logger.log('🤖 Starting AI moderation analysis for post:', newPost.id);
        
        // Analizar contenido con IA
        const aiResult = await analyzeContentWithAI(content, {
          contentType: 'post',
          userId: user.id,
          previousWarnings: await getUserWarningsCount(user.id, supabase),
        });
        
        logger.log('🤖 AI Analysis Result:', {
          postId: newPost.id,
          isInappropriate: aiResult.isInappropriate,
          confidence: (aiResult.confidence * 100).toFixed(1) + '%',
          categories: aiResult.categories,
          requiresHumanReview: aiResult.requiresHumanReview,
        });
        
        // Registrar análisis en BD
        await logAIModerationAnalysis(
          user.id,
          'post',
          newPost.id,
          content,
          aiResult,
          supabase
        );
        
        // Si la IA detectó contenido inapropiado
        if (aiResult.isInappropriate) {
          logger.log('🚨 Inappropriate content detected! Deleting post:', newPost.id);
          
          // ELIMINAR EL POST
          const { error: deleteError } = await supabase
            .from('community_posts')
            .delete()
            .eq('id', newPost.id);
          
          if (deleteError) {
            logger.error('❌ Error deleting flagged post:', deleteError);
          } else {
            logger.log('✅ Post deleted successfully:', newPost.id);
          }
          
          // Registrar advertencia
          const warningResult = await registerWarning(
            user.id,
            content,
            'post',
            supabase
          );
          
          logger.log('⚠️ Warning registered for user:', {
            userId: user.id,
            warningCount: warningResult.warningCount,
            userBanned: warningResult.userBanned,
          });
          
          // Si el usuario fue baneado (4ta advertencia)
          if (warningResult.userBanned) {
            logger.log('🚫 User has been banned:', user.id);
          }
        } else {
          logger.log('✅ Content approved by AI moderation:', newPost.id);
        }
        
      } catch (error) {
        logger.error('❌ Error in background AI moderation:', error);
      }
    })();

    // Responder inmediatamente con el post creado
    return NextResponse.json({
      post: newPost,
      success: true,
      aiModerationPending: true // Indica que el análisis de IA está en proceso
    });

  } catch (error) {
    logger.error('❌ Error in create post API:', error);
    
    // Asegurar que siempre devolvemos un JSON válido
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const errorDetails = error instanceof Error && process.env.NODE_ENV === 'development' 
      ? { stack: error instanceof Error ? error.stack : undefined }
      : undefined;
    
    return NextResponse.json(
      { 
        error: 'Error al crear el post',
        details: errorMessage,
        ...errorDetails
      },
      { status: 500 }
    );
  }
}
