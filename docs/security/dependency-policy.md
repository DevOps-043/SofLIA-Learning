# Dependency security policy

Ultima revision: 2026-05-18

## Objetivo

Mantener dependencias sin vulnerabilidades high/critical conocidas, reducir riesgo de supply chain y evitar licencias incompatibles con distribucion B2B.

## Controles activos

| Control | Implementacion | Criterio |
|---|---|---|
| Secret scanning | `.github/workflows/security-secrets.yml` con Gitleaks | 0 secretos detectados |
| Audit productivo | `npm audit --audit-level=high --omit=dev` en CI | 0 high/critical en runtime |
| Licencias | `license-checker --failOn "GPL;AGPL"` en CI | 0 dependencias GPL/AGPL |
| Dependabot | `.github/dependabot.yml` para root, `apps/web`, `apps/api` | PR semanal patch/minor |

## Reglas de actualizacion

- Patch/minor: Dependabot puede abrir PR agrupado; requiere tests verdes.
- Major: revision manual de breaking changes, plan de rollback y aprobacion de owner del modulo.
- Dependencia nueva: justificar necesidad, revisar mantenimiento, licencia, popularidad, superficie de ataque y alternativa existente.
- Dependencia abandonada: crear issue de reemplazo si no tiene release de seguridad activo o mantiene vulnerabilidades high/critical.

## Licencias

Permitidas por defecto: MIT, ISC, BSD, Apache-2.0, MPL-2.0.

Bloqueadas por defecto: GPL, AGPL. Cualquier excepcion requiere aprobacion legal y arquitectura documentada.

## Respuesta ante vulnerabilidades

| Severidad | SLA | Accion |
|---|---:|---|
| Critical | 24 h | Parche, override temporal o rollback de feature |
| High | 72 h | Parche u override con issue de seguimiento |
| Moderate | 14 dias | Planificar update en sprint |
| Low | 30 dias | Actualizar cuando no implique riesgo operativo |

## Validacion local 2026-05-18

- `npm audit --audit-level=high --omit=dev`: exit 0, sin vulnerabilidades high/critical.
- Vulnerabilidades moderadas pendientes de triage: `file-type` y `ws`.
- `license-checker --production --excludePrivatePackages --failOn "GPL;AGPL"`: exit 0.
- Licencias no bloqueantes detectadas para revision legal/arquitectura: `Hippocratic-2.1` en `@react-leaflet/core` y `react-leaflet`.

## Evidencia requerida en PR

- Output de `npm audit --audit-level=high --omit=dev` o link al job verde.
- Cambios en `package-lock.json` revisados.
- Para majors: nota de breaking changes y validacion manual de flujos afectados.
