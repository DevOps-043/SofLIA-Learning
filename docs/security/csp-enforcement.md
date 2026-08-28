# CSP enforcement runbook

Ultima revision: 2026-08-27

## Objetivo

Pasar Content Security Policy de report-only a enforcement sin romper flujos productivos.

## Estado actual

- Header aplicado por `middleware.ts`: `Content-Security-Policy` con nonce unico por request.
- `script-src` no permite `unsafe-inline` ni `unsafe-eval`; `strict-dynamic` propaga la confianza desde el nonce.
- Endpoint de reportes: `/api/csp-report`.
- Los reportes se registran como `csp-violation` en `security_audit_log` cuando la tabla esta disponible.

## Validacion de enforcement

1. Mantener report-only al menos 14 dias naturales en produccion.
2. Confirmar menos de 5 violaciones legitimas por dia durante los ultimos 3 dias del soak.
3. Clasificar violaciones por origen: aplicacion propia, extension del navegador, CDN externo, integracion OAuth/video/calendario.
4. Ajustar la politica solo para origenes necesarios y documentados.
5. Ejecutar smoke test de auth, OAuth Google/Microsoft, reproduccion de video, subida de archivos, LIA chat y Study Planner.
6. Ejecutar securityheaders.com contra staging o produccion y guardar evidencia del grade.

## Rollback

Un rollback de CSP requiere revertir el cambio de middleware y redesplegar. No existe una
bandera de produccion que pueda desactivar silenciosamente este control.

## Evidencia requerida

| Fecha | Entorno | Owner | Violaciones legitimas/dia | Grade securityheaders.com | Decision |
|---|---|---|---:|---|---|
| 2026-08-27 | Local/CI | Engineering | 0 en pruebas automatizadas | n/d | Enforced listo para staging |
