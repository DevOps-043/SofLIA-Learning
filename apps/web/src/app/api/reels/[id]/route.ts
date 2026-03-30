import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { z } from 'zod';

// ✅ Schema de validación para UUID
const ReelIdSchema = z.string().uuid('ID de reel inválido');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // ✅ SEGURIDAD: Validar que el ID sea un UUID válido
    try {
      ReelIdSchema.parse(id);
    } catch (error) {
      return NextResponse.json(
        { error: 'ID de reel inválido' },
        { status: 400 }
      );
    }

    // Obtener el reel con información del creador
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
      return NextResponse.json({ error: 'Reel no encontrado' }, { status: 404 });
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

    // Registrar visualización
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    await supabase
      .from('reel_views')
      .insert({
        reel_id: id,
        ip_address: clientIP,
        user_agent: request.headers.get('user-agent') || 'unknown'
      });

    return NextResponse.json({
      reel: {
        ...reel,
        hashtags: hashtags?.map((h: any) => h.reel_hashtags.name) || []
      },
      comments: comments || []
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Verificar autenticación
    const { SessionService } = await import('../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      hashtags = []
    } = body;

    // Verificar que el usuario es el creador del reel
    const { data: existingReel } = await supabase
      .from('reels')
      .select('created_by')
      .eq('id', id)
      .single();

    if (!existingReel || existingReel.created_by !== user.id) {
      return NextResponse.json({ error: 'No tienes permisos para editar este reel' }, { status: 403 });
    }

    // Actualizar el reel
    const { data: updatedReel, error: updateError } = await supabase
      .from('reels')
      .update({
        title,
        description,
        category,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Error al actualizar el reel' }, { status: 500 });
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
              hashtag_id: hashtag.id
            });
        }
      }
    }

    return NextResponse.json({
      reel: updatedReel,
      message: 'Reel actualizado exitosamente'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Verificar autenticación
    const { SessionService } = await import('../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que el usuario es el creador del reel
    const { data: existingReel } = await supabase
      .from('reels')
      .select('created_by')
      .eq('id', id)
      .single();

    if (!existingReel || existingReel.created_by !== user.id) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar este reel' }, { status: 403 });
    }

    // Marcar como inactivo en lugar de eliminar
    const { error: deleteError } = await supabase
      .from('reels')
      .update({ is_active: false })
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: 'Error al eliminar el reel' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Reel eliminado exitosamente'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
