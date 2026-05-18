# Runbook: DB connections above 80% pool

## Alert

`DB connections > 80% of pool`

## First checks

1. Confirm Supavisor/PgBouncer pool size and active vs idle connections.
2. Identify routes with increased request rate.
3. Check slow queries and long transactions.
4. Validate whether load tests or background jobs are running.

## Mitigation

- Pause non-critical background jobs.
- Reduce concurrency for bulk imports and exports.
- Enable or tune cache for hot read endpoints.
- Scale Supabase compute or pool only after confirming queries are healthy.

## Escalation

Escalate if connection saturation lasts longer than 10 minutes or causes auth/course traffic failures.
