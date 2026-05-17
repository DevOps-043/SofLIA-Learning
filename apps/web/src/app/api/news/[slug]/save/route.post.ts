import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '../../../../../lib/supabase/server';

import { logger } from '@/lib/utils/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;

    // Obtener el usuario actual
    const { SessionService } = await import('../../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener la noticia por slug
    const { data: news, error: newsError } = await supabase
      .from('noticias')
      .select('id')
      .eq('slug', resolvedParams.slug)
      .eq('is_active', true)
      .single();

    if (newsError || !news) {
      return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 });
    }

    // Verificar si ya está guardada
    const { data: existing, error: existingError } = await supabase
      .from('saved_news')
      .select('id')
      .eq('user_id', user.id)
      .eq('news_id', news.id)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      logger.error('Error checking saved news:', existingError);
      return NextResponse.json({ error: 'Error al verificar estado' }, { status: 500 });
    }

    // Si ya existe, eliminarla (toggle)
    if (existing) {
      const { error: deleteError } = await supabase
        .from('saved_news')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        logger.error('Error removing saved news:', deleteError);
        return NextResponse.json({ error: 'Error al quitar guardado' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        saved: false,
        message: 'Noticia quitada de guardados'
      });
    }

    // Si no existe, guardarla
    const { error: insertError } = await supabase
      .from('saved_news')
      .insert({
        user_id: user.id,
        news_id: news.id,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      logger.error('Error saving news:', insertError);
      return NextResponse.json({ error: 'Error al guardar noticia' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      saved: true,
      message: 'Noticia guardada exitosamente'
    });

  } catch (error) {
    logger.error('Error in save news API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
