# Runbook: queue backlog above threshold

## Alert

`queue_jobs_pending > threshold` or `queue_jobs_failed_total increasing`

## First checks

1. Identify queue name, job type and oldest pending job age.
2. Check worker deployment health and external providers used by the job.
3. Inspect failure reason without logging PII.

## Mitigation

- Pause new enqueueing for non-critical jobs.
- Increase worker concurrency only when DB and provider limits are healthy.
- Re-drive failed idempotent jobs after root cause is fixed.
- Do not retry payment or destructive operations without idempotency keys.

## Escalation

Escalate if user-visible processing is delayed more than the product SLA.
