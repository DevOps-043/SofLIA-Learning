# Select Star Audit

Snapshot: 2026-05-18

Scope: static inventory of `.select('*')` / `.select("*")` references for task 2.1.

Current static count in `apps/web/src`: 0.

## Resultado

| Categoria | Count | Estado |
|---|---:|---|
| `.select('*')` literals | 0 | Done |
| `.select("*")` literals | 0 | Done |
| Explicit selectors via `SELECT_COLUMNS` | 132 | Done |
| Legacy schema-gap selectors using `SELECT_COLUMNS.<table> = '*'` | 7 | Documented |

## Legacy Schema Gaps

These tables/views are referenced by application code but are missing or incomplete in the generated Supabase TS schema. They are routed through `SELECT_COLUMNS` so new `.select('*')` calls stay blocked; next DB type regeneration should replace these fallback selectors with concrete columns.

| Selector | Reason | Follow-up |
|---|---|---|
| `communities` | Legacy table absent from generated schema | Regenerate DB types or add migration-backed type |
| `community_members` | Legacy table absent from generated schema | Regenerate DB types or add migration-backed type |
| `community_post_reports` | Legacy table absent from generated schema | Regenerate DB types or add migration-backed type |
| `news` | Legacy table absent from generated schema | Regenerate DB types or add migration-backed type |
| `organization_subscriptions` | Legacy table absent from generated schema | Regenerate DB types or add migration-backed type |
| `user_group_members` | Legacy table absent from generated schema | Regenerate DB types or add migration-backed type |
| `user_groups` | Legacy table absent from generated schema | Regenerate DB types or add migration-backed type |
