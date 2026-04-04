import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { fromLoose } from '@/lib/supabase/looseQuery';

interface CommunityCommentRow {
  id: string;
  post_id: string;
  community_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  is_deleted: boolean | null;
  created_at: string;
  [key: string]: unknown;
}

interface CommunityCommentInsertRow {
  post_id: string;
  community_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string | null;
}

interface CommunityLookupRow {
  id: string;
}

interface CommentUserSummary {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
}

function commentsTable(client: unknown) {
  return fromLoose<CommunityCommentRow, CommunityCommentInsertRow>(
    client,
    'community_comments'
  );
}

function communitiesTable(client: unknown) {
  return fromLoose<CommunityLookupRow>(client, 'communities');
}

function getFallbackUser(userId: string): CommentUserSummary {
  return {
    id: userId,
    full_name: 'Usuario',
    avatar_url: null,
    username: 'usuario',
  };
}

function buildCommentUser(user: {
  id: string;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  profile_picture_url?: string | null;
  username?: string | null;
}): CommentUserSummary {
  return {
    id: user.id,
    full_name:
      user.display_name ||
      (user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : null) ||
      user.username ||
      'usuario',
    avatar_url: user.profile_picture_url ?? null,
    username: user.username ?? 'usuario',
  };
}
async function createClient() {
  const cookieStore = await cookies();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Variables de entorno de Supabase faltantes');
  }
  
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component - ignore
          }
        },
      },
    }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Obtener el usuario actual usando el sistema de sesiones personalizado
    const { SessionService } = await import('../../../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }



    const { postId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Obtener comentarios del post
    const { data: comments, error } = await commentsTable(supabase)
      .select('*')
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .is('parent_comment_id', null) // Solo comentarios principales
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: 'Error al obtener comentarios' }, { status: 500 });
    }

    // Obtener información de usuarios para los comentarios (optimizado)
    const topLevelComments = comments ?? [];
    const userIds = [...new Set(topLevelComments.map((comment) => comment.user_id))];
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, first_name, last_name, display_name, profile_picture_url')
      .in('id', userIds);

    if (usersError) {
    }

    // Crear mapa de usuarios para acceso rápido (optimizado)
    const usersMap = new Map<string, CommentUserSummary>();
    if (users) {
      users.forEach((user) => {
        usersMap.set(user.id, buildCommentUser(user));
      });
    }

    // Obtener respuestas para cada comentario
    const commentsWithReplies = await Promise.all(
      topLevelComments.map(async (comment) => {
        const { data: replies, error: repliesError } = await commentsTable(supabase)
          .select('*')
          .eq('parent_comment_id', comment.id)
          .eq('is_deleted', false)
          .order('created_at', { ascending: true });

        if (repliesError) {
        }

        // Agregar información del usuario a las respuestas
        const repliesWithUsers = (replies || []).map((reply) => ({
          ...reply,
          user: usersMap.get(reply.user_id) || getFallbackUser(reply.user_id)
        }));

        return {
          ...comment,
          user: usersMap.get(comment.user_id) || getFallbackUser(comment.user_id),
          replies: repliesWithUsers
        };
      })
    );

    // Obtener total de comentarios para paginación
    const { count: totalComments, error: countError } = await commentsTable(supabase)
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .is('parent_comment_id', null);

    if (countError) {
    }

    return NextResponse.json({
      comments: commentsWithReplies,
      pagination: {
        page,
        limit,
        total: totalComments || 0,
        totalPages: Math.ceil((totalComments || 0) / limit)
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Obtener el usuario actual usando el sistema de sesiones personalizado
    const { SessionService } = await import('../../../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }



    const { postId, slug } = await params;
    const { content, parent_comment_id } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'El contenido del comentario es requerido' }, { status: 400 });
    }

    if (content.trim().length > 1000) {
      return NextResponse.json({ error: 'El comentario es demasiado largo' }, { status: 400 });
    }

    // ⭐ MODERACIÓN CAPA 1: Verificar si contiene palabras prohibidas
    const { containsForbiddenContent, registerWarning, getUserWarningsCount } = await import('../../../../../../../lib/moderation');
    const forbiddenCheck = await containsForbiddenContent(content, supabase);

    if (forbiddenCheck.contains) {
      try {
        const warningResult = await registerWarning(
          user.id,
          content,
          'comment',
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
            error: `⚠️ El comentario contiene lenguaje inapropiado y ha sido bloqueado. ${warningResult.message}`,
            warning: true,
            warningCount: warningResult.warningCount,
            foundWords: forbiddenCheck.words
          },
          { status: 400 }
        );
      } catch (error) {
        // Si falla el registro, al menos bloquear el contenido
        return NextResponse.json(
          { error: 'El contenido contiene lenguaje inapropiado y ha sido bloqueado.' },
          { status: 400 }
        );
      }
    }

    // Obtener el community_id desde el slug
    const { data: community, error: communityError } = await communitiesTable(supabase)
      .select('id')
      .eq('slug', slug)
      .single();

    if (communityError || !community) {
      return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });
    }

    // Crear el comentario
    const newCommentPayload: CommunityCommentInsertRow = {
      post_id: postId,
      community_id: community.id,
      user_id: user.id,
      content: content.trim(),
      parent_comment_id: parent_comment_id || null,
    };
    const { data: newComment, error: insertError } = await commentsTable(supabase)
      .insert(newCommentPayload)
      .select('*')
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Error al crear comentario' }, { status: 500 });
    }

    // Agregar información del usuario al comentario (optimizado)
    const commentWithUser = {
      ...newComment,
      user: buildCommentUser(user)
    };

    // Actualizar contador de comentarios en el post
    const { error: updateError } = await supabase.rpc('increment_comment_count', {
      post_id: postId
    });

    if (updateError) {
    }

    // Crear notificación para el autor del post (en background)
    (async () => {
      try {
        // Obtener información del post para saber quién es el autor
        const { data: post } = await supabase
          .from('community_posts')
          .select('user_id')
          .eq('id', postId)
          .single();

        if (post && post.user_id && post.user_id !== user.id) {
          const { AutoNotificationsService } = await import('../../../../../../../features/notifications/services/auto-notifications.service');
          await AutoNotificationsService.notifyCommunityPostComment(
            postId,
            newComment.id,
            post.user_id,
            user.id,
            content.trim(),
            community.id
          );
        }
      } catch (notificationError) {
        // Error silenciado para no afectar el flujo principal
      }
    })().catch(() => {}); // Fire and forget

    // ⭐ MODERACIÓN CAPA 2: Análisis con IA DESPUÉS de crear el comentario
    // Este análisis se ejecuta en background sin bloquear la respuesta
    (async () => {
      try {
        const { 
          analyzeContentWithAI, 
          logAIModerationAnalysis,
          shouldAutoBan 
        } = await import('../../../../../../../lib/ai-moderation');
        
        // Analizar contenido con IA
        const aiResult = await analyzeContentWithAI(content, {
          contentType: 'comment',
          userId: user.id,
          previousWarnings: await getUserWarningsCount(user.id, supabase),
        });
        
        
        // Registrar análisis en BD
        await logAIModerationAnalysis(
          user.id,
          'comment',
          newComment.id,
          content,
          aiResult,
          supabase
        );
        
        // Si la IA detectó contenido inapropiado
        if (aiResult.isInappropriate) {
          // ELIMINAR EL COMENTARIO
          const { error: deleteError } = await supabase
            .from('community_comments')
            .delete()
            .eq('id', newComment.id);
          
          if (deleteError) {
          } else {
            // Decrementar el contador de comentarios
            const { error: decrementError } = await supabase.rpc('decrement_comment_count', {
              post_id: postId
            });
            
            if (decrementError) {
            }
          }
          
          // Registrar advertencia
          const warningResult = await registerWarning(
            user.id,
            content,
            'comment',
            supabase
          );
          
          // Si el usuario fue baneado (4ta advertencia)
          if (warningResult.userBanned) {
            }
        } else {
          }
        
      } catch (error) {
      }
    })();

    // Responder inmediatamente con el comentario creado
    return NextResponse.json({ 
      message: 'Comentario creado exitosamente',
      comment: commentWithUser,
      aiModerationPending: true // Indica que el análisis de IA está en proceso
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
