# Runbook: 5xx error rate above 1%

## Alert

`5xx error rate > 1% for 5 minutes`

## First checks

1. Group errors by route and provider.
2. Use `X-Correlation-Id` to trace one failing request end to end.
3. Check whether circuit breakers are open for OpenAI, Gemini, Google Calendar, GitHub or Redis.
4. Confirm Supabase health and recent migration/deploy activity.

## Mitigation

- For provider failures: keep degraded fallback enabled and avoid retry storms.
- For app regressions: rollback the deploy or disable the feature flag.
- For auth/session failures: verify Supabase Auth and cookie/session middleware.

## Escalation

Escalate immediately when auth, purchases, course completion or tenant isolation endpoints are affected.
