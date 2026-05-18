# Runbook: circuit breaker open

## Alert

`Circuit breaker open for provider`

## Providers

- `openai-*`
- `gemini-*`
- `google-calendar`
- `calendar-oauth`
- `github-releases`
- `redis-rate-limit`

## First checks

1. Confirm provider status page and recent error codes.
2. Check whether failures are timeouts, 429s or 5xx.
3. Verify recent traffic spike or load test activity.
4. Inspect affected user flow and fallback behavior.

## Mitigation

- Do not add retries to non-idempotent writes.
- Lower AI traffic, disable proactive AI calls or use cached fallback content.
- For Redis rate limit breaker, verify Upstash/Redis credentials and allow local fallback only while incident is active.
- For Calendar writes, queue retryable work only if operation is idempotent and user-visible state remains consistent.

## Recovery

The breaker moves to half-open after reset timeout. Confirm one successful probe closes it before declaring recovery.
