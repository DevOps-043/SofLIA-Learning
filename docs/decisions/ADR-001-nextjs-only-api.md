# ADR-001: Next.js API Routes como capa de API de negocio

**Estado:** Aceptado
**Fecha:** 2026-03-30

## Contexto

El repositorio es un monorepo con dos aplicaciones:
- `apps/web` — Next.js 14 (frontend + API routes)
- `apps/api` — Express 4 (backend independiente)

La pregunta era: ¿dónde vive la lógica de negocio de la API?

## Decisión

**Toda la lógica de negocio vive en Next.js API routes** (`apps/web/src/app/api/`).

Express (`apps/api`) se reserva exclusivamente para infraestructura y observabilidad:
- `GET /health` — health check con estado de BD
- `GET /metrics` — métricas de uptime y memoria
- `GET /api/v1/version` — versión del build

## Razones

1. **Colocation con Supabase**: Next.js API routes pueden importar directamente `@/lib/supabase/server` y los tipos de BD. Express necesitaría duplicar esta configuración.
2. **Despliegue simplificado**: Solo un app para desplegar en producción (Vercel/Netlify). Express es opcional.
3. **Volumen de rutas**: Existen ~494 API routes en Next.js. Migrarlas a Express sería un refactor masivo de alto riesgo sin beneficio claro.
4. **Middlewares de auth ya maduros**: `requireAdmin()`, `requireBusiness()` están integrados con el flujo de Next.js.

## Consecuencias

- `apps/api` se mantiene como servicio de infraestructura (health checks, métricas).
- No añadir lógica de negocio a Express sin una decisión arquitectural explícita.
- Los middlewares de Express (`auth.ts`, `hierarchicalAuth.ts`, `errorHandler.ts`) existen pero no se usan en rutas de negocio. Están disponibles si se decide implementar rutas Express reales.

## Alternativas consideradas

**Express como API principal**: Descartado. La integración con Supabase, los tipos, y el deployment ya están optimizados para Next.js.

**Microservicios**: Descartado para el estado actual. El volumen de tráfico no justifica la complejidad operacional.
