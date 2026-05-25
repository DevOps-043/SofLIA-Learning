# Decision de read replicas

## Tarea cubierta

TECH_DEBT_REMEDIATION.md 4.12 - Read patterns y, si es necesario, read replicas.

## Decision

No habilitar read replica todavia.

La decision queda en estado "deferido con guardrail": solo se habilitara una replica de lectura cuando las metricas de produccion o staging aislado muestren simultaneamente:

- Reads > 80 % del total de operaciones DB durante una ventana sostenida de 30 minutos.
- CPU de Postgres > 60 % sostenida en la misma ventana.
- p95 de endpoints de analytics/dashboard > 500 ms y evidencia de espera DB, no de red o IA.

## Datos disponibles al 2026-05-18

| Fuente | Resultado | Interpretacion |
|---|---:|---|
| `rg --files apps/web/src/app/api/[orgSlug] -g route*.ts` | 120 route files | Superficie multi-tenant amplia; analytics/dashboards son candidatos futuros para cliente read-only. |
| `rg -n "requireBusiness|requireBusinessUser|requireOrgAccess" apps/web/src/app/api/[orgSlug]` | 140 ocurrencias | La mayoria de rutas invocan el flujo de auth/tenant existente directa o delegadamente. |
| `load-test-results/**/snapshots.jsonl` | 0 snapshots locales | No hay baseline historico de DB en el repo para justificar replica. |
| `tools/load-testing/collect-metrics.ts` | Existe collector con RPC `load_test_connection_snapshot` | Hay ruta tecnica para capturar snapshots, pero no hay output versionado. |

## Query de medicion requerida

Ejecutar en Supabase SQL Editor o via RPC segura server-only, nunca desde cliente:

```sql
select
  datname,
  xact_commit + xact_rollback as total_transactions,
  blks_hit + blks_read as total_block_reads,
  tup_returned + tup_fetched as read_rows,
  tup_inserted + tup_updated + tup_deleted as write_rows,
  round(
    100.0 * (tup_returned + tup_fetched)
      / nullif(tup_returned + tup_fetched + tup_inserted + tup_updated + tup_deleted, 0),
    2
  ) as read_ratio_pct,
  blks_hit,
  blks_read,
  round(100.0 * blks_hit / nullif(blks_hit + blks_read, 0), 2) as cache_hit_pct
from pg_stat_database
where datname = current_database();
```

CPU debe tomarse desde Supabase Dashboard/Reports en la misma ventana temporal.

## Plan si el umbral se cumple

1. Habilitar read replica en Supabase Pro+.
2. Crear `supabaseRead` server-only con anon key o service role minimo segun RLS.
3. Migrar primero endpoints de solo lectura:
   - `app/api/[orgSlug]/business/reports-analytics/`
   - `app/api/[orgSlug]/business-user/analytics/`
   - dashboards de business/business-user.
4. Mantener escrituras, mutaciones y lecturas read-after-write en primary.
5. Agregar metricas separadas por cliente `db_client=primary|replica`.

## Riesgos

- Replica lag puede mostrar dashboards obsoletos tras una mutacion.
- Supabase replica incrementa costo operativo y complejidad de debugging.
- Habilitarla sin baseline puede ocultar queries ineficientes que deben resolverse primero.
