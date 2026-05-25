# Sistema de Tours — Índice de Prompts

Los prompts están separados en dos archivos independientes.

## Archivos

| Archivo                                              | Para quién                 | Cuándo ejecutar                                    |
|------------------------------------------------------|----------------------------|----------------------------------------------------|
| [tour-infraestructura.md](./tour-infraestructura.md) | Agente 0 — solo uno        | **Primero.** Construye todo el sistema compartido. |
| [tour-pagina.md](./tour-pagina.md)                   | Agentes 1–13 — en paralelo | **Después** de que el Agente 0 finalice.           |

## Cómo usar cada prompt

### Agente 0 (infraestructura)

1. Pegar el contenido completo de `prompt_maestro.md`
2. Pegar el contenido completo de `tour-infraestructura.md`
3. Ejecutar. Esperar a que finalice antes de lanzar los demás agentes.

### Agentes 1–13 (una página cada uno, en paralelo)

1. Pegar el contenido completo de `prompt_maestro.md`
2. Pegar el contenido completo de `tour-pagina.md`
3. Reemplazar los cinco `{{VARIABLES}}` de la sección "PÁGINA ASIGNADA"
   con los valores de la tabla de asignaciones al final de `tour-pagina.md`

## Flujo visual

```
Agente 0 (infraestructura)
    ↓ finaliza
    ├── Agente 1  (business-user-dashboard)    ─┐
    ├── Agente 2  (business-panel-dashboard)    │
    ├── Agente 3  (business-panel-users)        │
    ├── Agente 4  (business-panel-reports)      │
    ├── Agente 5  (study-planner-dashboard)     │ paralelo
    ├── Agente 6  (course-learn)                │
    ├── Agente 7  (admin-dashboard)             │
    ├── Agente 8  (admin-users)                 │
    ├── Agente 9  (business-user-analytics)     │
    ├── Agente 10 (business-panel-lps)          │
    ├── Agente 11 (user-dashboard)              │
    ├── Agente 12 (user-profile)                │
    └── Agente 13 (admin-companies)            ─┘
```

## Archivos que NO deben tocar los agentes de página

Estos archivos son creados y configurados por el Agente 0 solamente:

- `apps/web/src/features/tours/types.ts`
- `apps/web/src/features/tours/tour.store.ts`
- `apps/web/src/features/tours/index.ts`
- `apps/web/src/core/i18n/i18n.ts`
- Layouts de cada panel (solo Agente 0 añade `<TourProvider>`)

## Archivos que cada agente de página crea/modifica exclusivamente

- `apps/web/src/features/tours/config/{{TOUR_ID}}.tour.ts` — nuevo, solo suyo
- Componentes de su propia página — solo `data-tour-id` + hook
- Su sub-clave `{{I18N_SUB_KEY}}` en `tours.json` — sin tocar otras claves
