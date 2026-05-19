export interface MfaLoginVerifySuccess {
  redirectTo: string;
  verified: true;
}

export interface MfaLoginVerifyFailure {
  error: string;
  redirectMessage?: string;
  redirectTo?: string;
  verified: false;
}

export type MfaLoginVerifyResult = MfaLoginVerifySuccess | MfaLoginVerifyFailure;

export function normalizeMfaLoginToken(token: string): string {
  return token.replace(/\s+/gu, '').trim().toUpperCase();
}

export async function verifyMfaLoginChallenge(input: {
  challengeToken: string;
  fallbackError: string;
  token: string;
}): Promise<MfaLoginVerifyResult> {
  const response = await fetch('/api/auth/mfa/verify', {
    body: JSON.stringify({
      challengeToken: input.challengeToken,
      token: normalizeMfaLoginToken(input.token),
    }),
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });

  const payload = await readJsonPayload(response);
  if (!response.ok) {
    return {
      error: readApiError(payload) ?? input.fallbackError,
      redirectMessage: readRedirectMessage(payload) ?? undefined,
      redirectTo: readRedirectToValue(payload) ?? undefined,
      verified: false,
    };
  }

  const payloadError = readApiError(payload);
  if (payloadError) {
    return {
      error: payloadError,
      redirectMessage: readRedirectMessage(payload) ?? undefined,
      redirectTo: readRedirectToValue(payload) ?? undefined,
      verified: false,
    };
  }

  const redirectTo = readRedirectTo(payload);
  if (!redirectTo) {
    return {
      error: input.fallbackError,
      verified: false,
    };
  }

  return {
    redirectTo,
    verified: true,
  };
}

async function readJsonPayload(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function readApiError(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const candidate = payload as { error?: unknown; message?: unknown };
  if (typeof candidate.message === 'string') return candidate.message;
  if (typeof candidate.error === 'string') return candidate.error;
  return null;
}

function readRedirectTo(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const candidate = payload as { redirectTo?: unknown; success?: unknown; verified?: unknown };
  return (candidate.verified === true || candidate.success === true) &&
    typeof candidate.redirectTo === 'string'
    ? candidate.redirectTo
    : null;
}

function readRedirectToValue(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const candidate = payload as { redirectTo?: unknown };
  return typeof candidate.redirectTo === 'string' ? candidate.redirectTo : null;
}

function readRedirectMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const candidate = payload as { redirectMessage?: unknown };
  return typeof candidate.redirectMessage === 'string' ? candidate.redirectMessage : null;
}
