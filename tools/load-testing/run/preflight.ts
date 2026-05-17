import { timedFetch } from '../http';
import type { QaUser } from '../types';

export async function validateTargetUsesSeededSessions(params: {
  baseUrl: string;
  manifestUsers: QaUser[];
  requestTimeoutMs: number;
  runId: string;
}) {
  const firstUser = params.manifestUsers[0];
  if (!firstUser) {
    throw new Error('Seed manifest has no QA users. Run npm run load:seed first.');
  }

  const result = await timedFetch({
    runId: params.runId,
    profile: 'manual',
    flow: 'preflight',
    name: 'auth-me-preflight',
    baseUrl: params.baseUrl,
    path: '/api/auth/me',
    user: firstUser,
    timeoutMs: params.requestTimeoutMs,
    captureResponseText: true,
  });

  if (result.ok) return;

  const detail = result.error || result.responseText || 'No response body';
  throw new Error(
    [
      `Authenticated preflight failed before starting load: /api/auth/me returned ${result.status}.`,
      `Response: ${detail}`,
      'The Netlify target is not accepting the seeded QA legacy session.',
      'Verify that the Netlify branch/deploy-preview environment points to the same Supabase project used by LOAD_TEST_SUPABASE_URL, redeploy Netlify, then rerun npm run load:seed.',
    ].join(' '),
  );
}
