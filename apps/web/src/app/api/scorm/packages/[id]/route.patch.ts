import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, status } = body;

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined && ['active', 'inactive'].includes(status)) {
      updateData.status = status;
    }

    const { data, error } = await supabase
      .from('scorm_packages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update package' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, package: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update package' },
      { status: 500 }
    );
  }
}
