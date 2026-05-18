import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SessionService } from '@/features/auth/services/session.service';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordSecurityEvent } from '@/lib/security/security-events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DeleteAccountSchema = z.object({
  confirmation: z.string().min(1).max(255),
  reason: z.string().max(500).optional(),
}).strict();

export async function POST(request: NextRequest) {
  const user = await SessionService.getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = DeleteAccountSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Confirmacion invalida' }, { status: 400 });
  }

  const confirmation = parsed.data.confirmation.trim().toLowerCase();
  const expectedValues = [user.email, user.username, 'delete']
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());

  if (!expectedValues.includes(confirmation)) {
    recordSecurityEvent('privacy-deletion-requested', {
      actorId: user.id,
      actorRole: user.cargo_rol,
      result: 'denied',
      metadata: { reason: 'confirmation_mismatch' },
    });
    return NextResponse.json({ error: 'La confirmacion no coincide' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: existingRequest, error: existingError } = await supabase
    .from('privacy_deletion_requests')
    .select('id, scheduled_deletion_at, status')
    .eq('subject_user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: 'No se pudo validar la solicitud' }, { status: 500 });
  }

  if (existingRequest) {
    return buildDeletionResponse(existingRequest.scheduled_deletion_at);
  }

  const { data: deletionRequest, error } = await supabase
    .from('privacy_deletion_requests')
    .insert({
      subject_user_id: user.id,
      user_id: user.id,
      requester_ip: getClientIp(request),
      user_agent: request.headers.get('user-agent'),
      metadata: {
        reasonProvided: Boolean(parsed.data.reason),
      },
    })
    .select('scheduled_deletion_at')
    .single();

  if (error || !deletionRequest) {
    return NextResponse.json({ error: 'No se pudo crear la solicitud' }, { status: 500 });
  }

  await revokeUserSessions(user.id);
  recordSecurityEvent('privacy-deletion-requested', {
    actorId: user.id,
    actorRole: user.cargo_rol,
    resourceType: 'user',
    resourceId: user.id,
  });

  return buildDeletionResponse(deletionRequest.scheduled_deletion_at);
}

function buildDeletionResponse(scheduledDeletionAt: string) {
  const response = NextResponse.json({
    success: true,
    status: 'pending',
    scheduledDeletionAt,
  });

  for (const cookieName of ['aprende-y-aplica-session', 'access_token', 'refresh_token']) {
    response.cookies.set(cookieName, '', {
      httpOnly: true,
      maxAge: 0,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  return response;
}

async function revokeUserSessions(userId: string) {
  const supabase = createAdminClient();
  const revokedAt = new Date().toISOString();

  await Promise.all([
    supabase
      .from('refresh_tokens')
      .update({
        is_revoked: true,
        revoked_at: revokedAt,
        revoked_reason: 'privacy_deletion_requested',
      })
      .eq('user_id', userId)
      .eq('is_revoked', false),
    supabase
      .from('user_session')
      .update({ revoked: true })
      .eq('user_id', userId)
      .eq('revoked', false),
  ]);
}

function getClientIp(request: NextRequest) {
  return (
    request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || null
  );
}
