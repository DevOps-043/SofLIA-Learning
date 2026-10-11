import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createAuthActionClient } from '@/lib/supabase/auth-server';
import { SessionService } from '@/features/auth/services/session.service';
import { generateDesktopAccessProof } from '@/features/auth/services/desktop-sso.service';
import { applyAuthRateLimit } from '@/lib/auth/auth-rate-limit';

const headers = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' };
const fail = (status: number) => NextResponse.json({ success: false }, { status, headers });

async function connectionInput(request: NextRequest): Promise<{ replace: boolean } | null> {
  const reader = request.body?.getReader();
  if (!reader) return null;
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let size = 0;
    let raw = '';
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 128) { void reader.cancel(); return null; }
      raw += decoder.decode(chunk.value, { stream: true });
    }
    const input = JSON.parse(raw + decoder.decode()) as { replace?: unknown } | null;
    return typeof input?.replace === 'boolean' ? { replace: input.replace } : null;
  } catch { return null; }
  finally { reader.releaseLock(); }
}

/** Crea una sesión web independiente a partir del bearer SOFIA del escritorio. */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if ((origin && origin !== request.nextUrl.origin) || request.headers.get('x-pulsehub-session') !== '1') return fail(403);
  const match = /^Bearer ([^\s]{40,8192})$/.exec(request.headers.get('authorization') || '');
  if (!match) return fail(401);
  try {
    const input = await connectionInput(request);
    if (!input) return fail(400);
    const db = createAdminClient();
    const { data, error } = await db.auth.getUser(match[1]);
    if (error || !data.user) return fail(401);
    const limited = applyAuthRateLimit(request, data.user.id);
    if (limited) return new NextResponse(limited.body, { status: limited.status, headers: limited.headers });
    const { data: profile, error: profileError } = await db.from('users').select('id,is_banned').eq('id', data.user.id).maybeSingle();
    if (profileError) return fail(503);
    if (!profile || profile.is_banned) return fail(403);
    const membership = await db.from('organization_users').select('id,organizations!inner(id)')
      .eq('user_id', data.user.id).eq('status', 'active').eq('organizations.is_active', true).limit(1).maybeSingle();
    if (membership.error) return fail(503);
    if (!membership.data) return fail(403);
    const existing = await SessionService.getCurrentUser();
    if (existing && !input.replace) return NextResponse.json({ success: true, userId: existing.id, preserved: true }, { headers });
    const proof = await generateDesktopAccessProof(data.user.id);
    if (!proof) return fail(503);
    const client = await createAuthActionClient();
    const verified = await client.auth.verifyOtp({ token_hash: proof.tokenHash, type: 'magiclink' });
    if (verified.error || verified.data.user?.id !== data.user.id) return fail(503);
    const response = NextResponse.json({ success: true, userId: data.user.id }, { headers });
    response.cookies.set('pulsehub_session', '1', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 31536000 });
    return response;
  } catch { return fail(503); }
}
