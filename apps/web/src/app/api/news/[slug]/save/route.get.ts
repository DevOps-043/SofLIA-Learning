import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '../../../../../lib/supabase/server';

import { logger } from '@/lib/utils/logger';

// GET para verificar si está guardada
export async function GET(
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
      return NextResponse.json({ saved: false });
    }

    // Obtener la noticia por slug
    const { data: news, error: newsError } = await supabase
      .from('noticias')
      .select('id')
      .eq('slug', resolvedParams.slug)
      .single();

    if (newsError || !news) {
      return NextResponse.json({ saved: false });
    }

    // Verificar si está guardada
    const { data: saved, error: savedError } = await supabase
      .from('saved_news')
      .select('id')
      .eq('user_id', user.id)
      .eq('news_id', news.id)
      .single();

    if (savedError && savedError.code !== 'PGRST116') {
      logger.error('Error checking saved status:', savedError);
    }

    return NextResponse.json({ saved: !!saved });

  } catch (error) {
    logger.error('Error in check saved news API:', error);
    return NextResponse.json({ saved: false });
  }
}
