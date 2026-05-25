# Runbook: p95 latency budget exceeded

## Alert

`http_request_duration_seconds p95 > budget x2 for 5 minutes`

## First checks

1. Identify route, method, deploy SHA and correlation IDs in the APM/log provider.
2. Check recent deploys and feature flags for the affected route.
3. Compare DB query duration, cache hit ratio and external API duration for the same window.

## Mitigation

- If DB time dominates: inspect slow query plan and indexes before increasing capacity.
- If external API time dominates: verify circuit breaker state and provider status.
- If cache hit ratio dropped: verify Redis availability and recent invalidation changes.
- If only one deploy is affected: rollback to the last healthy deploy.

## Escalation

Escalate to Staff Engineer + SRE when p95 remains above budget for 15 minutes or error rate also rises.
