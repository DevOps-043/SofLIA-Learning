import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker';
import { incrementCounter } from '@/lib/observability/metrics';

export interface HumanVerificationResult {
  ok: boolean;
  error?: string;
  skipped?: boolean;
}

type HumanVerificationInput = FormData | Record<string, unknown>;

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const HCAPTCHA_VERIFY_URL = 'https://hcaptcha.com/siteverify';

export async function requireHumanVerification(
  formData: HumanVerificationInput,
): Promise<HumanVerificationResult> {
  const provider = resolveCaptchaProvider();
  if (!provider) {
    recordHumanVerificationMetric('skipped', 'none');
    return { ok: true, skipped: true };
  }

  const token = readCaptchaToken(formData, provider.responseField);
  if (!token) {
    recordHumanVerificationMetric('missing_token', provider.name);
    return { ok: false, error: 'Completa la verificacion humana para continuar.' };
  }

  const body = new URLSearchParams({
    secret: provider.secret,
    response: token,
  });

  const response = await fetchWithCircuitBreaker(
    `captcha-${provider.name}`,
    provider.verifyUrl,
    {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );

  if (!response.ok) {
    recordHumanVerificationMetric('provider_error', provider.name);
    return { ok: false, error: 'No se pudo validar la verificacion humana.' };
  }

  const payload = await response.json() as { success?: boolean };
  if (payload.success) {
    recordHumanVerificationMetric('accepted', provider.name);
    return { ok: true };
  }

  recordHumanVerificationMetric('rejected', provider.name);
  return { ok: false, error: 'La verificacion humana no fue aceptada.' };
}

function resolveCaptchaProvider() {
  if (process.env.TURNSTILE_SECRET_KEY) {
    return {
      name: 'turnstile',
      responseField: 'cf-turnstile-response',
      secret: process.env.TURNSTILE_SECRET_KEY,
      verifyUrl: TURNSTILE_VERIFY_URL,
    } as const;
  }

  if (process.env.HCAPTCHA_SECRET_KEY) {
    return {
      name: 'hcaptcha',
      responseField: 'h-captcha-response',
      secret: process.env.HCAPTCHA_SECRET_KEY,
      verifyUrl: HCAPTCHA_VERIFY_URL,
    } as const;
  }

  return null;
}

function readCaptchaToken(
  formData: HumanVerificationInput,
  providerField: string,
) {
  if (formData instanceof FormData) {
    const token =
      formData.get(providerField)
      || formData.get('captchaToken')
      || formData.get('captcha_token');
    return typeof token === 'string' ? token.trim() : '';
  }

  const token = formData.captchaToken || formData.captcha_token || formData[providerField];
  return typeof token === 'string' ? token.trim() : '';
}

function recordHumanVerificationMetric(outcome: string, provider: string) {
  incrementCounter('human_verification_total', {
    outcome,
    provider,
  });
}
