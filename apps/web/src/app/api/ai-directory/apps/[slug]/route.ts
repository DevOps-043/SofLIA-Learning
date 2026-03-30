import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;

    const { data: app, error } = await supabase
      .from('ai_apps')
      .select(`
        *,
        ai_categories (
          name,
          slug,
          color,
          icon
        )
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 }
      );
    }

    // TODO: Increment view count when types are fixed
    // if (app) {
    //   await supabase
    //     .from('ai_apps')
    //     .update({ view_count: app.view_count + 1 })
    //     .eq('app_id', app.app_id);
    // }

    return NextResponse.json({ app });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
