import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { createClient } from '@/lib/supabase/server';
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';
import type { Json } from '@/lib/supabase/types';

import {
  createStructureSchema,
  type CreateStructureBody,
} from '../_schemas';

export async function GET(_request: NextRequest) {
  const supabase = await createClient();

  const auth = await requireBusiness();
  if (auth instanceof NextResponse) return auth;

  const { organizationId } = auth;
  if (!organizationId) {
    return apiError('NO_ORGANIZATION', 'Organization context missing', 400);
  }

  const { data: structures, error } = await supabase
    .from('organization_structures')
    .select(SELECT_COLUMNS.organization_structures)
    .eq('organization_id', organizationId)
    .order('is_default', { ascending: false })
    .order('name');

  if (error) {
    return apiError('LIST_STRUCTURES_FAILED', error.message, 500);
  }

  return NextResponse.json({ structures });
}

async function handlePost(_request: NextRequest, body: CreateStructureBody) {
  const supabase = await createClient();

  const auth = await requireBusiness();
  if (auth instanceof NextResponse) return auth;

  const { organizationId } = auth;
  if (!organizationId) {
    return apiError('NO_ORGANIZATION', 'Organization context missing', 400);
  }

  const { data: existingDefault, error: defaultError } = await supabase
    .from('organization_structures')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('is_default', true)
    .limit(1)
    .maybeSingle();

  if (defaultError) {
    return apiError('CREATE_STRUCTURE_FAILED', defaultError.message, 500);
  }

  const { data, error } = await supabase
    .from('organization_structures')
    .insert({
      name: body.name,
      description: body.description ?? null,
      template: body.template ?? null,
      metadata: (body.metadata ?? null) as Json,
      organization_id: organizationId,
      created_by: auth.userId,
      is_default: !existingDefault,
    })
    .select()
    .single();

  if (error) {
    return apiError('CREATE_STRUCTURE_FAILED', error.message, 500);
  }

  return NextResponse.json({ data });
}

export const POST = withZodBody(createStructureSchema, handlePost);
