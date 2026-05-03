# SofLIA Load Testing Harness

Versioned QA harness for staging load and stress validation. It seeds isolated QA data, runs concurrent virtual users, collects application/platform metrics, and writes an actionable report.

## Required environment

Set these against an isolated staging deployment:

```bash
cp .env.load-test.example .env.load-test
LOAD_BASE_URL=https://your-staging-or-deploy-preview.example
LOAD_CONFIRM_STAGING=true
LOAD_RUN_ID=launch-week-qa-001
LOAD_TARGET_VUS=700
LOAD_SEED_USERS=700
LOAD_AI_RATIO=0.05
LOAD_THINK_TIME_MS=1500
LOAD_THINK_TIME_JITTER_MS=1500
LOAD_PUBLIC_FLOW_MODE=once
LOAD_TEST_SUPABASE_URL=https://PROJECT.supabase.co
LOAD_TEST_SUPABASE_SERVICE_ROLE_KEY=...
```

Optional:

```bash
LOAD_NETLIFY_SITE_ID=...
LOAD_NETLIFY_TOKEN=...
LOAD_DB_METRICS_RPC=load_test_connection_snapshot
```

The runner refuses known production hosts unless `ALLOW_PRODUCTION_LOAD_TEST=true`.

## Commands

```bash
npm run load:seed
npm run load:check
npm run load:smoke
npm run load:700
npm run load:stress
npm run load:report
npm run load:cleanup
```

Results are written under `load-test-results/<LOAD_RUN_ID>/`:

- `users.json`: QA seed manifest and session cookies.
- `events.jsonl`: request-level metrics.
- `snapshots.jsonl`: app/Supabase/Netlify snapshots.
- `run-summary.json`: profile and run metadata.
- `summary.json` and `report.md`: aggregated findings.

## Notes

- For stress profile accuracy, seed at least the max VU count: `LOAD_SEED_USERS=1100 npm run load:seed`.
- `LOAD_AI_RATIO` controls how many VU iterations call `/api/lia/chat`. Keep it low for broad platform load and raise it for a dedicated IA ceiling test.
- `LOAD_PUBLIC_FLOW_MODE=once` visits public pages once per VU, which better represents users who land, authenticate, then work inside the app. Use `always` only for an explicit CDN/public-page saturation test.
- `LOAD_THINK_TIME_MS` plus `LOAD_THINK_TIME_JITTER_MS` prevents synchronized request bursts from a single runner.
- Supabase connection snapshots require a project RPC named by `LOAD_DB_METRICS_RPC`; without it, the report records a warning and still completes.
