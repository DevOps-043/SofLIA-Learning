# Data and software integrity policy

Ultima revision: 2026-05-18

## Objetivo

Cubrir OWASP A08: integridad de software y datos para releases, assets externos, backups, restauracion y migraciones.

## RPO/RTO

| Sistema | RPO objetivo | RTO objetivo | Owner |
|---|---:|---:|---|
| Supabase Postgres produccion | 15 min | 4 h | Platform |
| Supabase Storage | 24 h | 8 h | Platform |
| Releases `/downloads` | 0 min para metadata firmada | 2 h | Release |
| Documentos de configuracion | Git HEAD | 1 h | Platform |

## Backups

- Confirmar en Supabase que Point-in-Time Recovery esta activo para produccion.
- Ejecutar restore drill trimestral en ambiente aislado.
- Registrar evidencia de cada drill: fecha, snapshot usado, tablas validadas, checksum de muestra y tiempo real de restauracion.
- No usar backups productivos en entornos no productivos sin proceso de mascaramiento de PII.
- Procedimiento operativo: `docs/security/backup-restore-drill.md`.

## Checksums

- Backups: validar integridad con checksums de muestras criticas (`users`, `organizations`, `organization_users`, `study_sessions`).
- Releases descargables: publicar SHA-256 junto a cada artefacto.
- Storage sensible: registrar hash del archivo al completar uploads criticos donde aplique.

## SRI para assets externos

Politica: no cargar scripts desde CDN sin `integrity` y `crossorigin="anonymous"`.

Estado actual: no se detecta una politica central de allowlist de scripts externos. Las integraciones nuevas deben preferir paquetes npm o carga server-side. Si se agrega un script CDN, el PR debe incluir SRI.

## Code signing

Si `/downloads` distribuye desktop app o extension:

- Firmar binarios con certificado de release.
- Publicar checksum y firma.
- Validar firma en smoke test de release.
- Mantener claves de firma fuera de CI general; acceso minimo por environment protected.

## Migration safety

- No editar migraciones ya aplicadas en produccion.
- Toda migracion destructiva debe incluir rollback documentado en el mismo PR.
- Rollback minimo: SQL inverso o plan de restore puntual si el cambio no es reversible.
- Cambios de columnas sensibles requieren backfill idempotente y validacion post-migracion.

## Evidencia requerida

- Link o captura del backup/PITR activo en Supabase.
- Resultado de restore drill trimestral registrado en `docs/security/backup-restore-drill.md`.
- Checksums publicados para releases descargables.
- Checklist de rollback en PRs con migraciones destructivas.
