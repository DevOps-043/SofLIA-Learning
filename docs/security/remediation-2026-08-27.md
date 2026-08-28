# Remediacion integral de seguridad — 2026-08-27

## Alcance y resultado

Esta pasada contiene las brechas confirmadas de Data API y elimina rutas de bypass
adyacentes. El codigo queda listo para desplegar, pero la contencion productiva no se
considera cerrada hasta aplicar la migracion, invalidar credenciales y completar el
retest en el entorno real.

## Evidencia del incidente

Las capturas recibidas el 2026-08-27 confirman dos vectores: extraccion no autorizada
mediante el Data API de Supabase y creacion directa de cuentas Auth que el perfil
publico marcaba incorrectamente como verificadas. La evidencia incluye perfiles,
registros de recuperacion, datos de organizaciones y contenido LIA. No se reproducen
valores, identificadores ni datos personales en este repositorio. Que la clave `anon`
aparezca en el bundle es normal en Supabase; la vulnerabilidad fue que RLS, grants,
vistas, funciones, Storage y la configuracion de Auth confiaban demasiado en el
cliente.

Por respuesta conservadora, el alcance potencial debe calcularse sobre todas las
tablas, vistas, RPC y objetos de Storage accesibles a `anon`/`authenticated` durante la
ventana, no solo sobre las filas mostradas. Conservar la captura original como
evidencia restringida y evitar adjuntarla a tickets o canales con acceso amplio.

| Superficie | Control implementado |
|---|---|
| Data API / RLS | RLS forzado y privilegios deny-by-default; politicas sensibles reconstruidas |
| Vistas / RPC | privilegios implicitos de `PUBLIC`/`anon` revocados; solo contratos explicitos |
| Credenciales | sesiones, refresh/reset, OAuth, pagos e invitaciones solo por `service_role` |
| Altas / email | signup directo deshabilitado; confirmacion obligatoria y estado derivado de `auth.users` |
| RPC destructivos | wrappers publicos `security invoker`, guard de `auth.role()` y grant exclusivo a `service_role` |
| API | autorizacion central activa y default-deny para rutas no catalogadas |
| Uploads | autenticacion, matriz bucket/rol, paths por usuario, limites y validacion real de archivo |
| Storage | evidencia de reportes privada y firmada por 5 minutos; mutaciones de buckets privados cerradas |
| Navegador | CSRF por Origin/Sec-Fetch-Site y CSP enforced con nonce por request |
| Abuso | rate limiting distribuido; rutas criticas fallan cerradas en produccion sin Redis |
| SSRF | transcodificacion solo descarga objetos identificados por bucket/path autorizado |
| Diagnostico | endpoints de prueba y payload de depuracion eliminados |
| Entrada | auditoria estricta de 541 rutas; cero lecturas JSON sin validacion Zod |
| Supply chain | `npm audit --audit-level=low`: cero vulnerabilidades conocidas |

## Orden obligatorio de despliegue

1. Crear snapshot/backup verificable de Postgres y exportar la lista de politicas y grants actuales.
2. Aplicar, en orden, `20260827120000_emergency_data_api_lockdown.sql` y `20260827123000_unverified_account_containment.sql` primero en staging. La primera elimina todas las sesiones, refresh tokens y reset tokens existentes; la segunda corrige el estado de verificacion, pone en cuarentena cuentas coincidentes con la evidencia y revoca sus sesiones nativas.
3. Replicar en el proyecto Supabase alojado la configuracion de `supabase/config.toml`: signup directo deshabilitado, confirmacion de email activa, cambio de password seguro y rate limit reducido. El archivo local no modifica por si solo Auth en produccion.
4. Desplegar la aplicacion con `REDIS_URL`/`UPSTASH_REDIS_REST_*` configurado, porque auth, password, uploads, IA e imports fallan cerrados sin rate limiter distribuido en produccion.
5. Ejecutar smoke tests de registro/confirmacion/login/logout/refresh, perfil, cursos, LIA, certificados, imports, uploads y paneles Admin/Business.
6. Aplicar las migraciones y desplegar en produccion dentro de la misma ventana de cambio.
7. Ejecutar las consultas de verificacion y las pruebas negativas descritas abajo.

No ejecutar la migracion desde una estacion sin backup ni fuera de una ventana coordinada:
el cambio revoca accesos directos que antes dependian de politicas permisivas.

## Respuesta al incidente y rotacion

- Confirmar que la migracion elimino todas las filas activas de `user_session`, `refresh_tokens` y `password_reset_tokens`; exigir nuevo login y nueva solicitud de recuperacion.
- Rotar el JWT secret/las claves `anon` y `service_role` de Supabase en una ventana coordinada si no puede descartarse su uso fuera del Data API. Rotar la clave `anon` sin arreglar RLS no contiene el vector.
- Revocar en Google/Microsoft los access/refresh tokens persistidos y volver a enlazar las cuentas.
- Rotar `USER_JWT_SECRET`/`SOFLIA_SIGNING_SECRET` y cualquier clave cuya exposicion no pueda descartarse.
- Revisar los metodos de pago con el proveedor; no reutilizar blobs cifrados que hayan quedado expuestos sin evaluar la clave y el esquema criptografico.
- Conservar evidencias y timestamps sin copiar PII a tickets, logs o documentos.
- Revisar manualmente las cuentas con `ban_reason = 'SECURITY_INCIDENT_UNVERIFIED_ACCOUNT'`; la migracion las bloquea tanto en el perfil como en `auth.users`, revoca sus sesiones y las conserva para forense, no las elimina.
- Ejecutar la evaluacion legal/regulatoria y notificacion a titulares que corresponda al alcance real del incidente.

## Verificacion post-deploy

Como `anon`, cada `HEAD`/`SELECT` contra `users`, `user_session`,
`organization_users`, `lia_messages`, `password_reset_tokens`, `oauth_accounts`,
`payment_methods`, invitaciones, inscripciones y certificados debe devolver cero filas
o permiso denegado. No descargar datos durante el retest.

Ademas, enumerar vistas, vistas materializadas, funciones, procedimientos y buckets:
ninguno debe conservar privilegios implicitos para `PUBLIC` o `anon`. Los objetos del
bucket `reportes-screenshots` deben ser privados y solo resolverse mediante URL firmada
despues de autenticar al propietario o a un administrador.

Como usuario autenticado A:

- solo puede leer su perfil, membresias, conversaciones, inscripciones y certificados;
- no puede leer ninguna fila equivalente del usuario B;
- no puede seleccionar `password_hash`, `platform_role`, `is_banned` ni tokens;
- no puede modificar roles, baneo, verificacion, hash o identidad OAuth;
- no puede ejecutar `delete_user_cascade` ni `claim_legacy_course_progress`.

En Auth, un `signUp` directo con la clave `anon` debe ser rechazado. El registro de la
aplicacion debe crear un perfil con `email_verified = false`, enviar confirmacion y
denegar login hasta que `auth.users.email_confirmed_at` exista. Metadata suministrada
por el cliente nunca debe crear un perfil ni marcarlo como verificado.

Como `service_role`, los jobs y operaciones administrativas deben conservar acceso.

Consultas administrativas de evidencia:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

select table_schema, table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

select routine_schema, routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and grantee in ('PUBLIC', 'anon', 'authenticated')
order by routine_name, grantee;

select id, public
from storage.buckets
order by id;
```

## Pentest local de caja blanca y caja negra

La validacion del artefacto de produccion local encontro y corrigio controles que
las pruebas estaticas iniciales no detectaban:

- Next no incluia el middleware porque estaba fuera de `src`, por lo que CSP,
  autorizacion central, CORS/CSRF y limites globales no se ejecutaban.
- La CSP enviaba un nonce que no llegaba al HTML estatico; la shell ahora se
  renderiza por solicitud y Next aplica un nonce distinto a sus scripts.
- Las respuestas tempranas 4xx no declaraban consistentemente `no-store`.
- Los PDF de certificados estaban en un bucket publico; ahora el bucket queda
  privado y la descarga pasa por una API que valida ownership.
- Habia carga dinamica mediante `eval`/`new Function` en servidor.
- El endpoint publico de modulos seleccionaba localizadores de video,
  transcripciones y resumenes, permitia un fallback conceptual a borradores y
  combinaba progreso personal con cache semiestatica. Ahora solo entrega
  metadatos publicados y usa cache privada.
- Varias rutas publicas devolvian mensajes internos de excepciones.

Evidencia final local:

- `npm run pentest:local`: 39 de 39 controles aprobados.
- 28 archivos de pruebas de seguridad/regresion: 124 pruebas aprobadas; despues
  del ultimo ajuste de catalogo, 10 pruebas focalizadas adicionales aprobadas.
- 541 handlers API auditados: cero cuerpos JSON sin validacion declarada.
- build web de produccion aprobado y middleware presente en el manifiesto.
- 854 archivos del bundle inspeccionados: una clave `anon`, cero `service_role`.
- `npm audit --audit-level=low`: cero vulnerabilidades conocidas.
- cero usos de `eval` o `new Function` en codigo de produccion.

El runner `scripts/security/pentest-local.mjs` rechaza destinos remotos por
defecto para evitar ejecutar pruebas contra un entorno no autorizado.

## Validaciones que siguen requiriendo staging/produccion autorizada

El pentest local no demuestra por si solo el estado del proyecto Supabase
alojado. Antes de declarar cerrado el incidente todavia es obligatorio:

- aplicar ambas migraciones sobre una copia de staging y ejecutar las consultas
  reales de grants, RLS, vistas, RPC y buckets, junto con el script de solo
  lectura `scripts/security/data-integrity-audit.sql` y comparar sus conteos con
  el respaldo anterior al incidente;
- probar una matriz con cuentas sinteticas `anon`, no verificada, Usuario,
  Instructor, Business, Business User y Administrador, incluyendo IDOR entre dos
  organizaciones y dos usuarios;
- confirmar signup directo rechazado, confirmacion por email, login bloqueado
  antes de confirmar, recuperacion, MFA, revocacion y cuarentena en Auth real;
- verificar objetos existentes de cada bucket y que certificados/evidencias no
  sean descargables por URL publica historica;
- revisar configuracion efectiva de Netlify/CDN, Supabase Auth, Redis, SMTP,
  WAF/rate limiting, TLS, backups y logs del periodo comprometido;
- rotar secretos y comprobar que credenciales/sesiones anteriores dejaron de
  funcionar;
- ejecutar concurrencia, race conditions, uploads reales y retest externo desde
  una IP fuera de la infraestructura.

El type-check completo del repositorio conserva errores preexistentes fuera del
alcance de seguridad; los cinco errores encontrados en la ruta publica de
modulos fueron corregidos y esa ruta queda sin errores tipados.

## Rollback

Un rollback debe restaurar el snapshot y la version de aplicacion como una unidad. No
restaurar grants amplios ni desactivar RLS para recuperar funcionalidad: si un flujo
falla, migrarlo a una ruta server-only autorizada y mantener la contencion.
