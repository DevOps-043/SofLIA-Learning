# Supabase Migration Convention

All executable migrations in this directory must use:

```text
YYYYMMDDHHMMSS_short_description.sql
```

Examples:

```text
20260518120500_delete_user_cascade_function.sql
20260518121000_load_test_connection_snapshot.sql
20260410093000_reportes_problemas_domain.sql
```

## Rules

- Never edit a migration that has already been applied to a shared or production database.
- Create a new timestamped migration for every schema, function, policy, index, or storage change.
- Prefer idempotent SQL (`if not exists`, guarded `do $$` blocks, safe `create or replace function`) when a migration may run across environments with drift.
- Destructive changes require a rollback note in the migration header and an explicit operator approval before production apply.
- Manual reference SQL files do not belong in this directory unless they are timestamped and executable.

## Legacy Normalization

| Legacy file | Resolution |
|---|---|
| `BD.sql` | Removed from the executable migration directory. Its reportes domain was already materialized by `20260410093000_reportes_problemas_domain.sql`. |
| `create_cascade_delete_function.sql` | Renamed to `20260518120500_delete_user_cascade_function.sql` so Supabase can track it as a proper migration. |

## Operational Migrations

| Migration | Purpose |
|---|---|
| `20260518121000_load_test_connection_snapshot.sql` | Adds the service-role RPC used by load tests to verify Supavisor connection pressure during task 4.1. |
