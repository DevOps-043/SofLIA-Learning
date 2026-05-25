import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  evaluateSecurityAuditAlerts,
  type SecurityAuditEventForAlerting,
} from '@/lib/security/security-alerts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

type SecurityAuditApiRow = SecurityAuditEventForAlerting & {
  actor_role: string | null
  id: number
  metadata: unknown
  org_id: string | null
  resource_id: string | null
  resource_type: string | null
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const limitParam = Number(request.nextUrl.searchParams.get('limit') ?? DEFAULT_LIMIT);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(Math.trunc(limitParam), 1), MAX_LIMIT)
    : DEFAULT_LIMIT;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('security_audit_log')
    .select('id, occurred_at, actor_id, actor_role, action, resource_type, resource_id, ip, org_id, result, metadata')
    .order('occurred_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: 'No se pudo consultar el audit log' }, { status: 500 });
  }

  const rows = (data ?? []) as SecurityAuditApiRow[];
  const summary = rows.reduce<Record<string, number>>((counts, event) => {
    counts[event.result] = (counts[event.result] ?? 0) + 1;
    return counts;
  }, {});
  const alerts = evaluateSecurityAuditAlerts(rows);
  const events = rows.map(({ ip: _ip, ...event }) => event);

  return NextResponse.json(
    {
      alerts,
      events,
      summary,
    },
    {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
      },
    },
  );
}
