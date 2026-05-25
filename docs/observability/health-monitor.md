# Observability health monitor

Estado: monitor programado agregado con GitHub Actions.

## Script

`npm run observability:health-check`

Verifica:

- `GET /api/health`
- `GET /api/observability/health`

En produccion, `/api/observability/health` requiere `Authorization: Bearer $OBSERVABILITY_DASHBOARD_TOKEN`.

## CI

Workflow: `.github/workflows/observability-health-monitor.yml`

- Corre cada 15 minutos y manualmente.
- Falla si un endpoint no responde `2xx` o reporta `status` distinto de `ok`.
- Publica summary Markdown y artefacto JSON para historial.

## Variables

| Variable | Uso |
|---|---|
| `OBSERVABILITY_BASE_URL` | URL staging/production a monitorear. |
| `OBSERVABILITY_DASHBOARD_TOKEN` | Token bearer del dashboard de observabilidad. |
| `OBSERVABILITY_ALLOW_DEGRADED` | Permite estado `degraded`; default `false`. |

## Pendiente operativo

Configurar secretos por entorno y conectar notificaciones de fallos de workflow al canal de on-call.
