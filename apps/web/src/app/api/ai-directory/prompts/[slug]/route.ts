import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;

    const { data: prompt, error } = await supabase
      .from('ai_prompts')
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
        { error: 'Prompt not found' },
        { status: 404 }
      );
    }

    // TODO: Increment view count when types are fixed
    // if (prompt) {
    //   await supabase
    //     .from('ai_prompts')
    //     .update({ view_count: prompt.view_count + 1 })
    //     .eq('prompt_id', prompt.prompt_id);
    // }

    return NextResponse.json({ prompt });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
