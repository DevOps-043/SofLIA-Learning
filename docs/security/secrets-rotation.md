# Politica de rotacion de secretos

## Tarea cubierta

TECH_DEBT_REMEDIATION.md 5.2 - Criptografia y manejo de secretos.

## Alcance

Secretos obligatorios:

- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` cuando Supabase indique rotacion de anon keys
- `OPENAI_API_KEY`
- `GOOGLE_API_KEY`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `USER_JWT_SECRET`
- `GITLEAKS_LICENSE` para CI en repos de organizacion

## Cadencia

| Secreto | Cadencia | Owner | Rollback |
|---|---|---|---|
| Supabase service role | 90 dias y ante sospecha | DevOps/Security | Restaurar valor anterior solo durante ventana de rollback aprobada. |
| Proveedores IA | 90 dias y ante cambio de proveedor | Tech Lead IA | Revertir env var y revocar key nueva si falla. |
| OAuth Google/Microsoft | 90 dias o cambio de dominio/callback | DevOps/Auth | Mantener secreto anterior activo maximo 24 h durante despliegue. |
| USER_JWT_SECRET | 90 dias o incidente auth | Security/Auth | Rotacion coordinada con invalidacion de sesiones. |

## Procedimiento

1. Crear secreto nuevo en el proveedor.
2. Cargarlo en Netlify env vars con scope correcto:
   - Production separado de Deploy Previews.
   - Staging separado de Production.
3. Ejecutar smoke tests de auth, LIA, Study Planner y Calendar.
4. Desplegar.
5. Revocar secreto anterior.
6. Registrar fecha, owner y evidencia en el sistema interno de cambios.

## Controles CI

Se agrego `.github/workflows/security-secrets.yml` con Gitleaks. El workflow corre en push, pull request, manual y semanal. La configuracion sigue el ejemplo oficial de `gitleaks/gitleaks-action@v2`; en repositorios de organizacion se debe configurar `GITLEAKS_LICENSE` como GitHub Secret.

## Reglas

- Nunca guardar secretos en `.env`, docs, capturas, logs o fixtures.
- Nunca imprimir secretos en `console.*`, logger, errores HTTP o reports.
- Las credenciales OAuth persistidas deben almacenarse server-side y no llegar a componentes cliente.
- Cualquier hallazgo de Gitleaks bloquea merge hasta clasificarlo como secreto real o falso positivo documentado.
