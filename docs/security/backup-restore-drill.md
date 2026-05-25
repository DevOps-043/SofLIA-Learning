# Backup restore drill runbook

Ultima revision: 2026-05-18

## Objetivo

Validar trimestralmente que los backups de Supabase Postgres y Storage permiten restaurar datos criticos dentro del RPO/RTO definido.

## Alcance

- Base de datos Supabase de produccion.
- Storage privado con evidencias criticas.
- Tablas de mayor impacto: `users`, `organizations`, `organization_users`, `study_sessions`, `oauth_accounts`, `refresh_tokens`.

## Precondiciones

1. Confirmar que Point-in-Time Recovery esta activo en el proyecto Supabase de produccion.
2. Crear un proyecto Supabase aislado para el drill.
3. Usar datos anonimizados o un entorno con acceso restringido si el backup contiene PII.
4. Registrar ventana de restauracion objetivo antes de iniciar.

## Procedimiento

1. Registrar timestamp objetivo de restauracion.
2. Restaurar backup/PITR en el proyecto aislado.
3. Ejecutar conteos por tabla critica.
4. Comparar muestras hash contra el origen cuando sea permitido.
5. Validar una consulta funcional por dominio:
   - usuario y perfil;
   - membresia de organizacion;
   - sesiones de estudio;
   - cuenta OAuth;
   - refresh tokens revocados/no revocados.
6. Validar Storage con una muestra de archivos privados y signed URLs de corta duracion.
7. Medir duracion total y comparar contra RTO.
8. Documentar hallazgos, riesgos y acciones correctivas.
9. Destruir el entorno temporal o rotar credenciales si debe conservarse para investigacion.

## SQL de verificacion sugerido

```sql
select 'users' as table_name, count(*) from users
union all select 'organizations', count(*) from organizations
union all select 'organization_users', count(*) from organization_users
union all select 'study_sessions', count(*) from study_sessions
union all select 'oauth_accounts', count(*) from oauth_accounts
union all select 'refresh_tokens', count(*) from refresh_tokens;
```

Para checksums de muestra, seleccionar filas estables y calcular hash fuera del motor con columnas no sensibles, o usar `md5(row_to_json(t)::text)` solo en entornos autorizados.

## Registro de drills

| Fecha | Owner | Timestamp restaurado | RPO observado | RTO observado | Resultado | Evidencia |
|---|---|---|---:|---:|---|---|
| Pendiente | Platform | n/d | n/d | n/d | No ejecutado | Pendiente |

## Criterio de exito

- RPO observado <= 15 min para Postgres.
- RTO observado <= 4 h para Postgres.
- Conteos y muestras criticas consistentes.
- No se expone PII en entornos no autorizados.
- Acciones correctivas con owner y fecha si algun punto falla.
