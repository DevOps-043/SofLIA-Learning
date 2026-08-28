# Auditoria XSS e inyeccion

## Tarea cubierta

TECH_DEBT_REMEDIATION.md 5.3 - Sanitizacion y prevencion de inyeccion.

## Resumen

| Superficie | Resultado | Accion |
|---|---|---|
| `dangerouslySetInnerHTML` | 6 ocurrencias en 3 archivos | Contenido dinamico sanitizado con DOMPurify; usos estaticos documentados. |
| `.rpc(` | 34 ocurrencias en la auditoria base | No se detecta SQL construido en TypeScript; los RPC destructivos quedaron restringidos a wrappers autenticados de `service_role`. |
| Markdown compartido | Links podian aceptar protocolos no seguros | Se bloqueo `javascript:` y protocolos no permitidos; el parser renderiza React nodes en lugar de HTML inyectado. |
| Prompt injection LIA | Ya tenia detector; faltaba delimitador explicito del mensaje actual | Se agrego `buildCurrentTurnPrompt` con bloque no confiable. |
| Prompt injection Study Planner | Faltaba guardrail equivalente | Se agrego evaluacion de riesgo y delimitador antes de Gemini. |

## Inventario `dangerouslySetInnerHTML`

| Archivo | Uso | Riesgo | Estado |
|---|---|---|---|
| `apps/web/src/features/courses/components/learn/content-renderers/ReadingContentRenderer.tsx` | HTML de contenido de leccion/material | Alto: contenido DB/importado puede contener HTML | Mitigado con `sanitizeRichHtml`. |
| `apps/web/src/features/courses/components/learn/content-renderers/FormattedContentRenderer.tsx` | HTML de contenido de leccion/material | Alto: contenido DB/importado puede contener HTML | Mitigado con `sanitizeRichHtml`. |
| `apps/web/src/app/RootHead.tsx` | Scripts estaticos first-party y JSON policy | Bajo: constantes internas, no input usuario; JSON escapado contra cierre de script por `<` | Aceptado; requiere CSP en 5.5. |
| `apps/web/src/app/downloads/components/DownloadsPageChangelog.tsx` | Negritas del changelog | Bajo | Eliminado: renderiza React nodes, no HTML inyectado. |
| `apps/web/src/core/components/BusinessLogo/BusinessLogo.tsx` | CSS `@keyframes` estatico | Bajo | Eliminado: usa children de `<style>`. |
| `apps/web/src/features/admin/components/dashboard-layout-manager/DashboardGridStyles.tsx` | CSS grid estatico | Bajo | Eliminado: usa children de `<style>`. |

## Controles agregados

- `apps/web/src/lib/security/sanitize-html.ts` centraliza sanitizacion de HTML rico con DOMPurify.
- `apps/web/src/lib/security/__tests__/sanitize-html.test.ts` cubre scripts, event handlers, `style` y `javascript:`.
- `apps/web/src/shared/utils/__tests__/markdown.test.tsx` cubre links seguros y bloqueo de `javascript:`.
- `apps/web/src/app/downloads/components/DownloadsPageChangelog.tsx` renderiza negritas con JSX en lugar de `dangerouslySetInnerHTML`.
- `apps/web/src/app/api/lia/chat/__tests__/prompt-instructions.service.test.ts` valida delimitadores de input no confiable.
- `apps/web/src/app/api/study-planner/dashboard/chat/__tests__/security-guardrails.service.test.ts` valida bloqueo de prompt injection y wrapper para Gemini.

## Cierre

- La migracion de contencion revoca ejecucion publica/anonima de funciones `SECURITY DEFINER` y mueve las operaciones destructivas a `private`.
- La auditoria SSRF esta cerrada en `docs/security/ssrf-audit.md`; los fetches con URL controlada por usuario usan `safeFetch`.
- Nuevos cuerpos JSON sin `safeParse`/`withZodBody` hacen fallar `scripts/audit-route-validation.ts`.
