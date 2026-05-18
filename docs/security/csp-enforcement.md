# CSP enforcement runbook

Ultima revision: 2026-05-18

## Objetivo

Pasar Content Security Policy de report-only a enforcement sin romper flujos productivos.

## Estado actual

- Header por defecto: `Content-Security-Policy-Report-Only`.
- Endpoint de reportes: `/api/csp-report`.
- Los reportes se registran como `csp-violation` en `security_audit_log` cuando la tabla esta disponible.
- Enforce preparado por bandera: `CSP_ENFORCEMENT=true`.

## Criterio para activar enforcement

1. Mantener report-only al menos 14 dias naturales en produccion.
2. Confirmar menos de 5 violaciones legitimas por dia durante los ultimos 3 dias del soak.
3. Clasificar violaciones por origen: aplicacion propia, extension del navegador, CDN externo, integracion OAuth/video/calendario.
4. Ajustar la politica solo para origenes necesarios y documentados.
5. Ejecutar smoke test de auth, OAuth Google/Microsoft, reproduccion de video, subida de archivos, LIA chat y Study Planner.
6. Ejecutar securityheaders.com contra staging o produccion y guardar evidencia del grade.

## Activacion

Configurar en el entorno objetivo:

```bash
CSP_ENFORCEMENT=true
```

Reiniciar/desplegar la app y validar que el header enviado sea `Content-Security-Policy`.

## Rollback

1. Remover `CSP_ENFORCEMENT` o configurarlo en `false`.
2. Redesplegar.
3. Confirmar que el header vuelve a `Content-Security-Policy-Report-Only`.
4. Mantener recoleccion de reportes y abrir issue con las directivas que bloquearon funcionalidad real.

## Evidencia requerida

| Fecha | Entorno | Owner | Violaciones legitimas/dia | Grade securityheaders.com | Decision |
|---|---|---|---:|---|---|
| Pendiente | Produccion | Security | n/d | n/d | Mantener report-only |
