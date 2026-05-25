import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { createClient } from '@/lib/supabase/server';

import { reelUpdateSchema, type ReelUpdateBody } from '../_schemas';

const ReelIdSchema = z.string().uuid('ID de reel invalido');

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    try {
      ReelIdSchema.parse(id);
    } catch (error) {
      return apiError('INVALID_REEL_ID', 'ID de reel invalido', 400);
    }

    // Obtener el reel con informacion del creador
    const { data: reel, error: reelError } = await supabase
      .from('reels')
      .select(`
        id,
        title,
        description,
        video_url,
        thumbnail_url,
        duration_seconds,
        category,
        language,
        is_featured,
        view_count,
        like_count,
        share_count,
        comment_count,
        created_by,
        created_at,
        published_at,
        users!reels_created_by_fkey (
          id,
          username,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (reelError || !reel) {
      return apiError('REEL_NOT_FOUND', 'Reel no encontrado', 404);
    }

    // Obtener hashtags
    const { data: hashtags } = await supabase
      .from('reel_hashtag_relations')
      .select(`
        reel_hashtags (
          name
        )
      `)
      .eq('reel_id', id);

    // Obtener comentarios recientes
    const { data: comments } = await supabase
      .from('reel_comments')
      .select(`
        id,
        content,
        created_at,
        users!reel_comments_user_id_fkey (
          id,
          username,
          first_name,
          last_name,
          profile_picture_url
        )
      `)
      .eq('reel_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10);

    // Registrar visualizacion
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    await supabase
      .from('reel_views')
      .insert({
        reel_id: id,
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || 'unknown',
      });

    return NextResponse.json({
      reel: {
        ...reel,
        hashtags: hashtags?.map((hashtag) => hashtag.reel_hashtags.name) || [],
      },
      comments: comments || [],
    });

  } catch (error) {
    return apiError('INTERNAL_SERVER_ERROR', 'Error interno del servidor', 500);
  }
}

async function handlePut(
  _request: NextRequest,
  body: ReelUpdateBody,
  { params }: RouteContext,
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Verificar autenticacion
    const { SessionService } = await import('../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autorizado', 401);
    }

    const {
      title,
      description,
      category,
      hashtags = [],
    } = body;

    // Verificar que el usuario es el creador del reel
    const { data: existingReel } = await supabase
      .from('reels')
      .select('created_by')
      .eq('id', id)
      .single();

    if (!existingReel || existingReel.created_by !== user.id) {
      return apiError(
        'FORBIDDEN',
        'No tienes permisos para editar este reel',
        403,
      );
    }

    // Actualizar el reel
    const { data: updatedReel, error: updateError } = await supabase
      .from('reels')
      .update({
        title,
        description,
        category,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return apiError('REEL_UPDATE_FAILED', 'Error al actualizar el reel', 500);
    }

    // Actualizar hashtags si se proporcionaron
    if (hashtags.length > 0) {
      // Eliminar hashtags existentes
      await supabase
        .from('reel_hashtag_relations')
        .delete()
        .eq('reel_id', id);

      // Agregar nuevos hashtags
      for (const hashtagName of hashtags) {
        const { data: hashtag } = await supabase
          .from('reel_hashtags')
          .upsert(
            { name: hashtagName.toLowerCase() },
            { onConflict: 'name' }
          )
          .select()
          .single();

        if (hashtag) {
          await supabase
            .from('reel_hashtag_relations')
            .insert({
              reel_id: id,
              hashtag_id: hashtag.id,
            });
        }
      }
    }

    return NextResponse.json({
      reel: updatedReel,
      message: 'Reel actualizado exitosamente',
    });

  } catch (error) {
    return apiError('INTERNAL_SERVER_ERROR', 'Error interno del servidor', 500);
  }
}

export const PUT = withZodBody(reelUpdateSchema, handlePut);

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Verificar autenticacion
    const { SessionService } = await import('../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autorizado', 401);
    }

    // Verificar que el usuario es el creador del reel
    const { data: existingReel } = await supabase
      .from('reels')
      .select('created_by')
      .eq('id', id)
      .single();

    if (!existingReel || existingReel.created_by !== user.id) {
      return apiError(
        'FORBIDDEN',
        'No tienes permisos para eliminar este reel',
        403,
      );
    }

    // Marcar como inactivo en lugar de eliminar
    const { error: deleteError } = await supabase
      .from('reels')
      .update({ is_active: false })
      .eq('id', id);

    if (deleteError) {
      return apiError('REEL_DELETE_FAILED', 'Error al eliminar el reel', 500);
    }

    return NextResponse.json({
      message: 'Reel eliminado exitosamente',
    });

  } catch (error) {
    return apiError('INTERNAL_SERVER_ERROR', 'Error interno del servidor', 500);
  }
}
