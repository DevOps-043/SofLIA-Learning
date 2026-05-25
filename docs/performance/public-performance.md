# Public performance gates

Estado: verificacion automatizable para TTFB/CDN cache y Lighthouse.

## Scripts

| Script | Uso |
|---|---|
| `npm run performance:public` | Mide TTFB, status y headers cache de rutas publicas. |
| `npm run performance:lighthouse` | Ejecuta Lighthouse CI con score minimo 0.90. |

## Rutas cubiertas

- `/`
- `/business`
- `/downloads`
- `/courses/$PUBLIC_PERFORMANCE_COURSE_SLUG` cuando existe slug
- `/news/$PUBLIC_PERFORMANCE_NEWS_SLUG` cuando existe slug

## Variables

| Variable | Uso |
|---|---|
| `PUBLIC_PERFORMANCE_BASE_URL` | URL staging/deploy-preview a medir. |
| `PUBLIC_PERFORMANCE_COURSE_SLUG` | Curso publico fixture para `/courses/[slug]`. |
| `PUBLIC_PERFORMANCE_NEWS_SLUG` | Noticia publica fixture para `/news/[slug]`. |
| `PUBLIC_PERFORMANCE_TTFB_BUDGET_MS` | Presupuesto TTFB; default `200`. |
| `PUBLIC_PERFORMANCE_LIGHTHOUSE_MIN_SCORE` | Score minimo Lighthouse performance; default `0.9`. |

## CI

Workflow: `.github/workflows/public-performance-weekly.yml`

- Corre semanalmente y manualmente.
- Publica `public-performance-results/ttfb.md` en el summary.
- Sube artefactos JSON/Markdown y Lighthouse.
- Falla si p95 TTFB supera 200 ms, faltan headers cache esperados o Lighthouse Performance baja de 90.

## Pendiente operativo

Configurar secretos en GitHub/Netlify staging y ejecutar la primera corrida real:

- `PUBLIC_PERFORMANCE_BASE_URL`
- `PUBLIC_PERFORMANCE_COURSE_SLUG`
- `PUBLIC_PERFORMANCE_NEWS_SLUG`
