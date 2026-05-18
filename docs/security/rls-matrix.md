# RLS Matrix

Snapshot: 2026-05-18

Audit method:
- Static scan of `supabase/migrations/**/*.sql`.
- Runtime verification with `pg_tables`, `pg_class.relrowsecurity`, and `pg_policies` is still required against the target Supabase database before marking task 2.5 complete.

Static result after remediation:
- Tables created in migrations: 23
- Tables with `ENABLE ROW LEVEL SECURITY` mentioned in migrations: 26
- Created tables missing static RLS mention: 0
- Guardrail test: `apps/web/src/lib/security/__tests__/rls-migrations.test.ts` scans `supabase/migrations/**/*.sql` and fails if a public `CREATE TABLE` lacks a matching `ENABLE ROW LEVEL SECURITY`.

The static audit found `public.reportes_problemas` without RLS. Migration `supabase/migrations/20260518120000_reportes_problemas_rls.sql` enables RLS, marks `reportes_con_usuario` as `security_invoker`, and adds owner/admin/service-role policies.

## Runtime Verification Query

```sql
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled,
  (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.tablename) AS policies_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY rls_enabled ASC, policies_count ASC;
```

## Matrix

| Tabla | RLS activo | SELECT (rol -> condicion) | INSERT | UPDATE | DELETE | Notas |
|---|---|---|---|---|---|---|
| `business_user_analytics_insight_cache` | Si | user owner | user owner | no directo | own expired / service_role | Cache de insights; validar runtime |
| `learning_path_items` | Si | assigned path / platform admin | platform admin | platform admin | platform admin | Politicas en hardening LP |
| `learning_paths` | Si | assigned / platform admin | platform admin | platform admin | platform admin | Politicas en hardening LP |
| `learning_preview_cache` | Si | organization member | service_role | service_role | service_role | Cache operacional |
| `learning_preview_summaries` | Si | service_role | service_role | service_role | service_role | Cache universal |
| `lesson_chat_suggestions` | Si | authenticated | service_role | service_role | service_role | Sugerencias no PII directa |
| `organization_course_intro_videos` | Si | org member/admin | org admin | org admin | org admin | Videos intro por curso |
| `organization_holidays` | Si | org member | org admin | org admin | org admin | Config planner org |
| `organization_learning_path_assignments` | Si | org member/admin | org admin | org admin | org admin | Asignaciones LP por org |
| `organization_learning_path_default_rules` | Si | org admin | org admin | org admin | org admin | Reglas default LP |
| `organization_lp_intro_videos` | Si | org member/admin | org admin | org admin | org admin | Videos intro por LP |
| `organization_planner_config` | Si | org member | org admin | org admin | org admin | Config planner org |
| `reportes_problemas` | Si | owner / Admin all | owner | Admin only | Admin only | Added in `20260518120000_reportes_problemas_rls.sql` |
| `soflia_dialogue_evaluations` | Si | service_role | service_role | service_role | service_role | Runtime dialogue server-only |
| `soflia_dialogue_events` | Si | service_role | service_role | service_role | service_role | Runtime dialogue server-only |
| `soflia_dialogue_results` | Si | service_role | service_role | service_role | service_role | Runtime dialogue server-only |
| `soflia_dialogue_sessions` | Si | service_role | service_role | service_role | service_role | Runtime dialogue server-only |
| `soflia_dialogue_turns` | Si | service_role | service_role | service_role | service_role | Runtime dialogue server-only |
| `user_activity_evaluations` | Si | owner/instructor context | owner/system | owner/system | no directo | Interactive activities |
| `user_activity_submissions` | Si | owner/instructor context | owner | owner | no directo | Interactive activities |
| `user_learning_path_assignments` | Si | owner / org admin | admin | admin | admin | User LP assignments |
| `user_learning_path_progress` | Si | owner / org admin | owner | owner | service_role/admin | User LP progress |
| `video_transcoding_jobs` | Si | Admin | Admin | Admin | Admin | Transcoding operations |

## Required Before Closing 2.5

1. Run the runtime verification query in Supabase after applying migrations.
2. Export rows with `rls_enabled = false` or `policies_count = 0`.
3. Add an E2E tenant-isolation test proving one user cannot read another organization's records.
4. Reconcile this static matrix with all pre-existing production tables generated before the current migration folder baseline.
