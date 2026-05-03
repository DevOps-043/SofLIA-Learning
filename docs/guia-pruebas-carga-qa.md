# Guia paso a paso: pruebas de carga y estres QA

Esta guia sirve para que ChatGPT, Codex o cualquier miembro del equipo te acompañe paso a paso para configurar y ejecutar las pruebas de carga de SofLIA.

Importante: no pegues claves secretas en chats. La `service_role key` de Supabase solo debe ir en el archivo local `.env.load-test`, que esta ignorado por git.

## Objetivo

Ejecutar pruebas de carga contra un ambiente aislado de staging o preview, no contra produccion.

La meta inicial es validar:

- 700 usuarios simultaneos.
- Netlify Functions y rutas dinamicas de Next.js.
- Supabase y consultas principales.
- Flujos autenticados.
- Study Planner.
- LIA / IA con una proporcion controlada de trafico.
- Generar un informe en `load-test-results/<run-id>/report.md`.

## Prompt para pedir ayuda a ChatGPT

Copia y pega esto en ChatGPT si quieres que te guie:

```text
Ayudame paso a paso a configurar y ejecutar las pruebas de carga de SofLIA.

Contexto:
- Estoy en el repo SofLIA-Learning.
- Tengo el harness en tools/load-testing.
- Debo llenar el archivo .env.load-test.
- No debo usar produccion ni pegar claves secretas en el chat.

Necesito que me guies de uno en uno para:
1. Conseguir una URL de Netlify Deploy Preview o Branch Deploy.
2. Conseguir el Project URL de Supabase staging.
3. Conseguir la service_role key o secret key de Supabase staging.
4. Llenar .env.load-test localmente.
5. Ejecutar npm run load:check.
6. Ejecutar npm run load:seed.
7. Ejecutar npm run load:smoke.
8. Generar npm run load:report.
9. Si smoke pasa, ejecutar npm run load:700.
10. Leer el reporte y decidir optimizaciones.

Hazme una sola instruccion por vez y espera mi confirmacion antes de avanzar.
```

## Paso 1: confirmar que estas en la rama correcta

En PowerShell:

```powershell
git branch --show-current
```

Debe mostrar algo como:

```text
qa/load-testing
```

## Paso 2: obtener URL segura de Netlify

No uses `soflia.ai` ni ningun deploy que diga `Production: main`.

Necesitas una URL de preview/staging como:

```text
https://deploy-preview-123--soflia-learning.netlify.app
```

o:

```text
https://qa-load-testing--soflia-learning.netlify.app
```

### Opcion recomendada: Deploy Preview por Pull Request

1. En GitHub, abre un Pull Request desde `qa/load-testing` hacia `main`.
2. Espera a que Netlify genere el Deploy Preview.
3. Copia la URL del preview.
4. Esa URL sera `LOAD_BASE_URL`.

### Opcion alternativa: Branch Deploy

En Netlify:

1. Ve a `Deploy settings`.
2. En `Branches and deploy contexts`, presiona `Configure`.
3. Permite branch deploy para la rama `qa/load-testing`.
4. Ejecuta o espera el deploy.
5. Copia la URL del branch deploy.

## Paso 3: obtener datos de Supabase staging

En Supabase:

1. Entra al proyecto de staging.
2. Ve a `Project Settings`.
3. Ve a `API Keys`.
4. Copia el `Project URL`.
5. Copia la `service_role` key o una `secret key` equivalente.

No pegues esa key en ChatGPT, Slack, correo, documentos ni frontend.

## Paso 4: llenar `.env.load-test`

Abre el archivo local:

```powershell
notepad .env.load-test
```

Llena estos campos:

```env
LOAD_BASE_URL=https://deploy-preview-123--soflia-learning.netlify.app
LOAD_CONFIRM_STAGING=true
LOAD_RUN_ID=launch-week-qa-001
LOAD_TARGET_VUS=700
LOAD_SEED_USERS=700
LOAD_AI_RATIO=0.05

LOAD_TEST_SUPABASE_URL=https://tu-proyecto.supabase.co
LOAD_TEST_SUPABASE_SERVICE_ROLE_KEY=tu_clave_secreta_aqui

LOAD_NETLIFY_SITE_ID=
LOAD_NETLIFY_TOKEN=
```

`LOAD_NETLIFY_SITE_ID` y `LOAD_NETLIFY_TOKEN` son opcionales. Sirven para enriquecer el reporte con metadatos de Netlify, pero las pruebas pueden correr sin ellos.

## Paso 5: validar configuracion

Ejecuta:

```powershell
npm run load:check
```

Debe terminar con:

```text
Configuration looks ready.
```

Si dice que falta algo, corrige `.env.load-test` y vuelve a ejecutar.

## Paso 6: sembrar usuarios QA

Esto crea datos sinteticos aislados con prefijo `qa_load_<run-id>`.

```powershell
npm run load:seed
```

Debe crear:

- Organizacion QA.
- 700 usuarios QA.
- Sesiones legacy.
- Curso sintetico.
- Planes y sesiones de Study Planner.
- Tracking minimo de leccion.

## Paso 7: correr prueba smoke

La smoke test usa 20 usuarios por 5 minutos.

```powershell
npm run load:smoke
```

Si falla aqui, no ejecutes la prueba de 700 todavia.

Si falla antes de iniciar con un mensaje como `/api/auth/me returned 401`, significa que el deploy de Netlify no esta leyendo la misma base de datos donde hiciste `load:seed`. En ese caso:

- Revisa en Netlify que el contexto del branch deploy o deploy preview tenga `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` apuntando al mismo proyecto usado en `LOAD_TEST_SUPABASE_URL`.
- Guarda los cambios de variables de entorno en Netlify.
- Ejecuta un nuevo deploy del branch/preview.
- Vuelve a correr `npm run load:seed` y despues `npm run load:smoke`.

## Paso 8: generar reporte smoke

```powershell
npm run load:report
```

Abre:

```text
load-test-results/launch-week-qa-001/report.md
```

Revisa:

- Error rate.
- Respuestas 5xx.
- Respuestas 429.
- Timeouts.
- Endpoints mas lentos por p95/p99.

## Paso 9: correr prueba de 700 usuarios

Solo si smoke paso:

```powershell
npm run load:700
npm run load:report
```

La prueba completa incluye:

- Ramp-up a 700 usuarios.
- Hold de 700 usuarios.
- Recovery.

## Paso 10: pruebas adicionales

Stress:

```powershell
npm run load:stress
npm run load:report
```

Spike:

```powershell
npm run load:spike
npm run load:report
```

Soak:

```powershell
npm run load:soak
npm run load:report
```

## Paso 11: limpiar datos QA

Cuando termines:

```powershell
npm run load:cleanup
```

Esto elimina solo datos del `LOAD_RUN_ID` actual.

## Criterios de aceptacion

Para la prueba nominal de 700 usuarios:

- Error rate total menor a 1%.
- Idealmente 0 respuestas 5xx.
- Core API p95 menor a 1500 ms.
- Core API p99 menor a 5000 ms.
- LIA p95 menor a 45000 ms.
- Sin timeouts sostenidos.
- Sin 429 en carga nominal con usuarios unicos.

## Que hacer si falla

Si aparecen 5xx:

- Revisar logs de Netlify Functions.
- Revisar logs de Supabase.
- Identificar el endpoint en `report.md`.
- Repetir smoke despues de corregir.

Si aparecen 429:

- Confirmar que `LOAD_SEED_USERS` sea igual o mayor a `LOAD_TARGET_VUS`.
- Confirmar que no se esta reutilizando un solo usuario.
- Revisar rate limits de middleware.

Si LIA esta lenta:

- Bajar `LOAD_AI_RATIO`.
- Correr prueba separada solo de IA.
- Revisar contexto enviado a Gemini/OpenAI.
- Revisar limites de Netlify Functions.

Si Supabase se satura:

- Revisar indices.
- Revisar consultas con p95 alto.
- Revisar conexiones activas/idle.
- Considerar pooling o aumentar compute antes del lanzamiento.

## Comandos rapidos

```powershell
npm run load:check
npm run load:seed
npm run load:smoke
npm run load:report
npm run load:700
npm run load:report
npm run load:cleanup
```
