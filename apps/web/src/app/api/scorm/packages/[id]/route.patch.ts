import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { createClient } from '@/lib/supabase/server';

import {
  scormPackagePatchSchema,
  type ScormPackagePatchBody,
} from '../../_schemas';

type RouteContext = { params: Promise<{ id: string }> };

async function handlePatch(
  _request: NextRequest,
  body: ScormPackagePatchBody,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('UNAUTHENTICATED', 'Unauthorized', 401);
    }

    const { title, description, status } = body;

    const updateData: Record<string, unknown> = {
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
      return apiError(
        'SCORM_PACKAGE_UPDATE_FAILED',
        'Failed to update package',
        500,
      );
    }

    return NextResponse.json({ success: true, package: data });
  } catch (error) {
    return apiError(
      'SCORM_PACKAGE_UPDATE_FAILED',
      'Failed to update package',
      500,
    );
  }
}

export const PATCH = withZodBody(scormPackagePatchSchema, handlePatch);
