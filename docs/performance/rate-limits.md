# Rate limits por endpoint

Estado: límites distribuidos en middleware/proxy con Redis REST o Supabase.

## Store

- Primario: Redis compartido via `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` o `REDIS_REST_URL` + `REDIS_REST_TOKEN`.
- Sin Redis, las rutas críticas de producción usan un contador atómico en Supabase. Requiere aplicar `20261005163929_distributed_rate_limit_supabase.sql` y las variables de servidor existentes `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
- Si el backend distribuido seleccionado falla, auth, password, uploads, IA e imports devuelven `503 RATE_LIMIT_SERVICE_UNAVAILABLE`. Una caída de Redis no cambia a Supabase a mitad de ventana, para evitar conceder un segundo presupuesto.
- Las lecturas y rutas no críticas conservan el fallback local. En desarrollo también se permite memoria local.
- Headers 429: `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- Las llaves distribuidas usan identificadores seudónimos; no almacenan IPs, tokens o cookies crudas. La tabla de Supabase está en `private`, con RLS y acceso exclusivo de `service_role`; la RPC es `SECURITY INVOKER` y no admite llamadas de `anon` ni `authenticated`.

## Politicas activas

| Tipo de endpoint | Match actual | RPM por usuario/IP | Burst | Window | Store |
|---|---|---:|---:|---:|---|
| Auth login/register | `/api/auth/login`, `/api/auth/register` | 5 | 3 | 60 s | Redis/Supabase |
| Auth password | `/api/auth/reset-password`, `/api/auth/forgot-password` | 5 | 3 | 60 s | Redis/Supabase |
| Mutaciones admin | `/api/admin/**` no-GET | 30 | 10 | 60 s | Redis/fallback local |
| Reads cacheable | GET `/api/**` | 300 | 50 | 60 s | Redis/fallback local |
| AI chat | `/api/ai-chat`, mutaciones `/api/lia`, rutas dashboard chat | 20 | 5 | 60 s | Redis/Supabase |
| Upload | rutas con `/upload` | 10 | 2 | 60 s | Redis/Supabase |
| Bulk import | rutas con `/import` | 2 | 1 | 60 s | Redis/Supabase |
| Public landing | `/`, `/business`, `/downloads` | 600 | 100 | 60 s | Redis/fallback local |
| API fallback | resto `/api/**` | 100 | 0 | 60 s | Redis/fallback local |

## Validacion esperada

1. Unit/local: `npm.cmd run test --workspace=apps/web -- src/core/lib/rate-limit/__tests__/rate-limit.test.ts`.
2. Configurar Redis REST en staging, o aplicar la migración de Supabase si no se utiliza Redis.
3. Ejecutar k6 `tests/load/mixed.js` contra staging.
4. Verificar que los 429 incluyan `Retry-After` y `X-RateLimit-*`.
5. Confirmar que múltiples instancias comparten conteo usando la misma llave en el backend seleccionado.

## Prueba real del chat

Desde la raíz del repositorio, en PowerShell:

```powershell
$env:SOFLIA_LIVE_SMOKE = '1'
npm run test --workspace=apps/web -- src/app/api/lia/chat/__tests__/chat.live.test.ts
Remove-Item Env:SOFLIA_LIVE_SMOKE
```

Esta prueba optativa carga `apps/web/.env.local`, consulta el modelo guardado de
`lia_general` y exige `gpt-6-luna`. Usa Supabase y OpenAI reales: verifica el
contador compartido y su respuesta 429, una respuesta del chat por JSON y un
segundo turno por SSE que debe recordar un código aleatorio. Solo se simula el
contexto HTTP sin sesión; no guarda conversaciones de usuarios. Consume tokens
de OpenAI y crea un contador temporal. No valida un despliegue remoto ni sustituye
la comprobación del chat autenticado en el navegador.

Si el contador real funciona pero el sitio devuelve `503
RATE_LIMIT_SERVICE_UNAVAILABLE`, revisar en Netlify el despliegue activo, las
variables disponibles en Functions y el motivo seguro del log del limiter
(`REDIS_REQUEST_FAILED` o `SUPABASE_RATE_LIMIT_UNAVAILABLE`). La configuración de
Redis, si existe, tiene precedencia; una RPC sana no basta para corregir una
instancia que sigue usando Redis. La corrección debe llegar al servidor activo
antes de dar el chat de producción por recuperado.

## Riesgos conocidos

- Supabase añade una escritura por solicitud crítica cuando no hay Redis. La limpieza elimina hasta 1000 contadores vencidos hace más de un día en aproximadamente el 1% de las llamadas.
- La semantica `burst` se aplica como capacidad adicional dentro de la ventana fija; no es token bucket continuo.
