# Analisis Completo de Deuda Tecnica - SofLIA Learning

> **Fecha del analisis:** 27 de marzo de 2026
> **Estandar de referencia:** `prompt_maestro.md` (Staff/Principal Engineer level)
> **Alcance:** Monorepo completo (frontend, backend, packages, migraciones, infraestructura)

---

## 1. Resumen Ejecutivo

| Metrica | Valor |
|---------|-------|
| **Indice de Deuda Tecnica (TDI)** | **66%** (Alto) |
| **Clasificacion** | Alto (escala: Bajo <25%, Moderado 25-50%, Alto 50-75%, Critico >75%) |
| **Archivos TS/TSX totales** | ~1,444 |
| **Lineas frontend (apps/web)** | ~361,671 |
| **Lineas backend (apps/api)** | 1,489 |
| **Cobertura de tests** | ~0.2% (7 archivos de test en lia-context unicamente) |
| **Componentes monoliticos criticos** | 10+ archivos sobre 2,000 lineas |
| **Usos de tipo `any`** | 223+ en 50+ archivos |
| **Console.logs en produccion** | 1,201 en 157 archivos |
| **Colores hexadecimales hardcodeados** | 255 archivos (viola las propias reglas del CLAUDE.md) |

### Veredicto

El proyecto tiene aspiraciones de calidad empresarial (definidas en `prompt_maestro.md`) pero el codigo viola la mayoria de sus propios estandares definidos. La deuda tecnica es **sistemica** -- no se trata de archivos aislados sino de patrones repetidos en toda la base de codigo. Sin intervencion, la velocidad de desarrollo seguira declinando y el riesgo de regresiones aumentara exponencialmente.

---

## 2. Deuda por Categoria

### Metodologia de Calculo

El TDI se calcula como promedio ponderado de 8 categorias (0 = sin deuda, 100 = deuda maxima). Los pesos reflejan la prioridad de `prompt_maestro.md` (correctitud, seguridad, legibilidad, mantenibilidad, modularidad, escalabilidad, performance, testabilidad, observabilidad, documentacion).

| Categoria | Peso | Deuda | Severidad | Justificacion |
|-----------|------|-------|-----------|---------------|
| **Testing y QA** | 15% | **97%** | CRITICO | 7 archivos de test en todo el proyecto. Sin framework de testing configurado. Sin CI/CD para tests. |
| **Arquitectura y Modularidad** | 20% | **68%** | ALTO | Solo 3/21 features tienen `types.ts`. 11+ features violan screaming architecture. Componentes monoliticos de hasta 11,933 lineas. 5+ API routes sobre 1,000 lineas. |
| **Calidad de Codigo** | 15% | **62%** | ALTO | 1,201 console.logs en 157 archivos. 105 TODO/FIXME en 53 archivos. 255 archivos con colores hardcodeados. Codigo comentado disperso. |
| **Type Safety** | 10% | **45%** | MEDIO | 223+ usos explicitos de `any`. Casts `as any` en middleware de auth. Tipos auto-generados de 9,063 lineas aceptables. |
| **Backend (Completitud)** | 10% | **92%** | CRITICO | 1,489 lineas totales. Todos los handlers son placeholders. Sin controllers, services, ni models. Sin ESLint. |
| **Seguridad** | 10% | **55%** | ALTO | `as any` en auth middleware bypasea type checking. `delete_user_manual.sql` en migraciones. Sin capa de validacion de input sistematica. Acoplamiento alto en auth. |
| **Base de Datos y Migraciones** | 10% | **58%** | ALTO | 52 migraciones con nombres mixtos. Duplicados en `001_*.sql`. Script destructivo en carpeta de migraciones. Sin estrategia de rollback. |
| **Documentacion y Observabilidad** | 10% | **40%** | MEDIO | CLAUDE.md detallado. prompt_maestro.md completo. Pero sin documentacion de API, sin ADRs, 1,201 console.logs en lugar de logging estructurado. |

**Calculo del TDI:**
```
(97 x 0.15) + (68 x 0.20) + (62 x 0.15) + (45 x 0.10) + (92 x 0.10) + (55 x 0.10) + (58 x 0.10) + (40 x 0.10)
= 14.55 + 13.60 + 9.30 + 4.50 + 9.20 + 5.50 + 5.80 + 4.00
= 66.45% => 66%
```

---

## 3. Codigo Spaghetti - Identificacion

### 3.1 Componentes Monoliticos Criticos

Estos archivos violan directamente las secciones 2, 3, 4, 9 y 15 de `prompt_maestro.md`:
- "No crees archivos gigantes con multiples responsabilidades"
- "Responsabilidad unica por modulo, clase, servicio o funcion"
- "Todo componente debe poder entenderse de forma aislada"

| Archivo | Lineas | useState | Hooks | Severidad | Problema |
|---------|--------|----------|-------|-----------|----------|
| `apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx` | **11,933** | 39+ | multiples | CRITICO | Mega-componente con UI, logica de negocio, estado, integracion AI, calendario, todo en un archivo. 220 console.logs. Imports comentados (Joyride). |
| `apps/web/src/app/courses/[slug]/learn/page.tsx` | **10,448** | -- | -- | CRITICO | Pagina con logica de negocio que deberia estar en features/courses. Renderizado complejo. |
| `apps/web/src/core/components/AIChatAgent/AIChatAgent.tsx` | **3,214** | -- | 99 | CRITICO | Chat rendering, message management, prompt generation, voice input/output, session recording, intent detection -- todo en un componente. |
| `apps/web/src/features/admin/components/CourseManagementPage.tsx` | **3,139** | 39 | -- | CRITICO | Tipos `any[]` dispersos. Fetch sin error handling. Colores hardcodeados (#0A2540, #00D4B3, #10B981, #F59E0B, #6C757D). Multiples estados de modals mezclados. |
| `apps/web/src/lib/lia-context/config/page-metadata.ts` | **2,919** | -- | -- | ALTO | Metadata hardcodeada para todas las paginas. Deberia ser distribuida o cargada dinamicamente. |
| `apps/web/src/features/business-panel/components/BusinessSettings.tsx` | **2,603** | -- | -- | ALTO | Org settings, branding, personalizacion en un solo archivo. Colores hardcodeados. TODOs incompletos. |
| `apps/web/src/core/components/LiaSidePanel.tsx` | **2,087** | -- | -- | ALTO | Sidebar con responsabilidades mixtas. |
| `apps/web/src/features/study-planner/components/StudyPlannerCalendar.tsx` | **1,729** | -- | -- | ALTO | Logica compleja de calendario mezclada con presentacion. |
| `apps/web/src/features/business-panel/components/hierarchy/HierarchyForms.tsx` | **1,441** | -- | -- | ALTO | Logica de forms compleja mezclada con UI. Sin descomposicion. |
| `apps/web/src/features/instructor/components/InstructorCourseManagementPage.tsx` | **1,445** | -- | -- | ALTO | Componente monolitico sin separacion. |

### 3.2 API Routes con Logica de Negocio (Fat Routes)

Violan `prompt_maestro.md` seccion 4: "No hagas logica de negocio incrustada en controladores" y seccion 6: "Toda API debe diseñarse con contratos claros".

| Archivo | Lineas | Problema |
|---------|--------|----------|
| `apps/web/src/app/api/study-planner/dashboard/chat/route.ts` | **2,856** | AI chat + gestion de sesiones + sincronizacion de calendario + parsing de acciones + 18 tipos de acciones diferentes, todo en un handler. |
| `apps/web/src/app/api/ai-chat/route.ts` | **2,595** | Gemini AI chat + deteccion de contexto + generacion de instrucciones (58+ ramas condicionales) + tracking de presencia + analytics + calculo de costos de tokens. |
| `apps/web/src/app/api/lia/chat/route.ts` | ~**1,421** | Responsabilidades mixtas. |
| `apps/web/src/app/api/[orgSlug]/business/reports/data/route.ts` | **1,084** | Query building + agregacion + transformacion de datos. |
| `apps/web/src/app/api/business/reports/data/route.ts` | **1,077** | **Duplicado** del anterior -- casi identico. |
| `apps/web/src/app/api/business/analytics/route.ts` | **1,006** | Logica de analytics en handler. 4+ queries secuenciales. |

### 3.3 Servicios God Object

| Archivo | Lineas | Problema |
|---------|--------|----------|
| `apps/web/src/features/study-planner/services/calendar-integration.service.ts` | **1,618** | Servicio gordo con multiples responsabilidades. |
| `apps/web/src/features/study-planner/services/lia-context.service.ts` | **1,271** | Contexto de LIA mezclado con logica de negocio. |
| `apps/web/src/features/notifications/services/auto-notifications.service.ts` | **1,187** | God object: scheduling, filtering, API calls, state management, notificaciones, tracking de cursos. Console.logs activos. |
| `apps/web/src/features/study-planner/services/user-context.service.ts` | **1,127** | Contexto de usuario mezclado con transformaciones. |
| `apps/web/src/features/auth/actions/oauth.ts` | **1,122** | Action file haciendo demasiado. Console.logs. Tipos `any`. |

---

## 4. Codigo Basura / Muerto

### 4.1 Codigo Deprecado
| Item | Ubicacion | Estado |
|------|-----------|--------|
| **authStore deprecado** | `apps/web/src/core/stores/authStore.ts` | Comentarios en lineas 5-7, 28-29, 37-39 indican que esta deprecado. Solo 1 archivo lo importa. Auth real usa server actions en `features/auth/actions/login.ts`. |
| **Imports comentados** | `StudyPlannerLIA.tsx` lineas 16-17 | Joyride importado pero comentado -- implementacion incompleta. |

### 4.2 Scripts Peligrosos en Migraciones
| Item | Ubicacion | Riesgo |
|------|-----------|--------|
| `delete_user_manual.sql` | `supabase/migrations/` | Script de eliminacion manual dentro de la carpeta de migraciones. Podria ejecutarse accidentalmente. **Mover a scripts/ separado.** |
| `BD.sql` | `supabase/migrations/` | Nombre vago (probablemente "Base de Datos"). No es una migracion real. |
| `Database.sql` | `supabase/migrations/` | Demasiado generico. No sigue convencion. |
| `Database_Optimizations.sql` | `supabase/migrations/` | Duplica esfuerzo con otros archivos de optimizacion. |

### 4.3 Codigo Duplicado
| Item | Ubicacion A | Ubicacion B | Funciones |
|------|------------|------------|-----------|
| **Utilidades duplicadas** | `packages/shared/src/utils/index.ts` | `apps/api/src/shared/utils/index.ts` | `isValidEmail()`, `isValidPassword()`, `sanitizeEmail()`, `generateSlug()`, `maskEmail()` -- 5 funciones identicas. |
| **API Routes duplicadas** | `apps/web/src/app/api/business/reports/data/route.ts` (1,077 lineas) | `apps/web/src/app/api/[orgSlug]/business/reports/data/route.ts` (1,084 lineas) | Logica de reportes casi identica. |
| **Servicios de traduccion** | `core/services/contentTranslation.service.ts` (343 lineas) | `core/services/courseTranslation.service.ts` (451 lineas) + `core/services/autoTranslation.service.ts` (311 lineas) | 3 servicios de traduccion haciendo cosas similares. |

### 4.4 Console.logs en Produccion

**1,201 ocurrencias en 157 archivos.** Esto no es logging estructurado -- es debug code que nunca se limpio.

Archivos mas afectados:
- `StudyPlannerLIA.tsx` -- 220 console.logs
- `auto-notifications.service.ts` -- multiples
- `oauth.ts` -- multiples
- Hooks de study-planner -- dispersos
- Backend: 21 console.logs comentados (inconsistente -- algunos comentados, otros no)

### 4.5 TODOs y Codigo Incompleto

**105 TODO/FIXME en 53 archivos** -- indican features a medio implementar:
- `AdminAppsPage.tsx` -- TODO para categorias dinamicas
- `BusinessSettings.tsx` -- TODO para seccion de personalizacion
- `AdminMaterials.service.ts` -- TODO para eliminacion de archivos
- `apps/api/src/middlewares/hierarchicalAuth.ts:244` -- **CRITICO:** "TODO: Implementar consulta real a Supabase" (auth usa datos placeholder)
- `apps/api/src/index.ts:62` -- "TODO: Implementar features" (todas las rutas)

---

## 5. Mapa de Acoplamiento y Fragilidad

### 5.1 Diagrama de Dependencias Criticas

```
                    +--------------------------+
                    |  SessionService          |
                    |  (202+ archivos dependen)|
                    +------------+-------------+
                                 |
                    +------------v-------------+
                    |  lib/supabase/server.ts  |
                    |  (punto unico de fallo)  |
                    +------------+-------------+
                                 |
                    +------------v-------------+
                    |  Supabase Client         |
                    +--------------------------+

    +------------------+    +------------------+    +------------------+
    | features/auth/*  |    | features/admin/* |    | features/        |
    | (202 importers)  |    | (158 archivos)   |    | business-panel/* |
    +--------+---------+    +--------+---------+    | (95 archivos)    |
             |                       |              +--------+---------+
             |                       |                       |
    +--------v---------+    +--------v---------+    +--------v---------+
    | core/stores/     |    | API Routes       |    | OrganizationStyle|
    | (4 stores)       |    | (500+ rutas)     |    | Context          |
    +------------------+    +------------------+    +------------------+
```

### 5.2 Zonas de Fragilidad (Cambiar X rompe Y)

| Si cambias... | Se rompe... | Archivos afectados | Severidad |
|---------------|-------------|-------------------|-----------|
| `SessionService` o auth middleware | Toda ruta protegida del sistema | 202+ archivos | CRITICO |
| `lib/supabase/types.ts` (auto-generado) | Todo archivo que toque la BD | Potencialmente cientos | CRITICO |
| `StudyPlannerContext` (26+ propiedades) | `StudyPlannerLIA.tsx` (11,933 lineas) y todos sus consumidores | 40+ archivos | ALTO |
| Tokens de tema/color compartidos | Nada -- porque 255 archivos tienen colores hardcodeados y NO usan los tokens | 0 (ese es el problema) | ALTO |
| `OrganizationStylesContext` | Todos los componentes branded del business panel | 30+ archivos | ALTO |
| `core/services/api.ts` (Axios) | Toda comunicacion frontend-backend | 50+ archivos | ALTO |
| Estructura de respuesta de API routes | Todos los consumidores frontend de esos endpoints | Variable | MEDIO |

### 5.3 Puntos Positivos de Acoplamiento

- **Sin imports circulares** entre features (verificado)
- **shared/ no importa de core/ ni features/** (regla respetada)
- **Dependency direction** es mayormente correcta (features -> core -> shared)
- **Zustand stores** tienen fronteras claras y responsabilidad enfocada (organizationStore, themeStore, shoppingCartStore)

---

## 6. Matriz de Riesgos

| Riesgo | Probabilidad | Impacto | Prioridad | Descripcion |
|--------|-------------|---------|-----------|-------------|
| Regresion al refactorizar monolitos | **Alta** | **Critico** | **P1** | Archivos de 11,933 lineas sin tests. Cualquier cambio puede romper funcionalidad sin deteccion. |
| Bypass de auth via `as any` casts | **Media** | **Critico** | **P1** | Type safety bypasseada en path critico de seguridad (`middlewares/auth.ts`). |
| Perdida de datos por migraciones desordenadas | **Media** | **Alto** | **P2** | Duplicados en `001_*.sql`, sin rollback, script destructivo en carpeta de migraciones. |
| Declive de velocidad de desarrollo | **Alta** | **Alto** | **P2** | Archivos gigantes ralentizan onboarding, aumentan conflictos de merge, dificultan code review. |
| Backend bloqueado | **Alta** | **Medio** | **P2** | Express backend 92% placeholder. Sin tests, sin lint, sin estructura. |
| Debugging ciego en produccion | **Alta** | **Medio** | **P3** | 1,201 console.logs en lugar de logging estructurado. Sin correlation IDs. Sin metricas. |
| Inconsistencia visual/branding | **Media** | **Bajo** | **P4** | 255 archivos con colores hardcodeados ignoran el sistema de diseno. |
| Rotura de features por cambio en auth | **Media** | **Critico** | **P1** | 202+ archivos dependen de SessionService. Cambio ahi = efecto cascada masivo. |

---

## 7. Scorecard de Arquitectura por Feature

Evaluacion contra el patron Screaming Architecture definido en `CLAUDE.md`:
- `components/` | `hooks/` | `services/` | `types.ts` | `index.ts`

| Feature | components | hooks | services | types.ts | index.ts | Score | Estado |
|---------|-----------|-------|----------|----------|----------|-------|--------|
| admin | Si | Si | Si | No | Si | 4/5 | Parcial (archivos gigantes) |
| study-planner | Si | Si | Si | No | Si | 4/5 | Parcial (monolitos severos) |
| onboarding | Si | Si | No | Si | Si | 4/5 | Parcial |
| business-panel | Si | Si | Si | No | No | 3/5 | Incompleto |
| auth | Si | Si | Si | No | No | 3/5 | Incompleto |
| courses | Si | Si | Si | No | No | 3/5 | Incompleto |
| communities | Si | Si | Si | No | No | 3/5 | Incompleto |
| instructor | Si | Si | Si | No | No | 3/5 | Incompleto |
| reels | Si | Si | Si | No | No | 3/5 | Incompleto |
| skills | Si | Si | Si | No | No | 3/5 | Incompleto |
| subscriptions | Si | Si | Si | No | No | 3/5 | Incompleto |
| profile | Si | Si | Si | No | No | 3/5 | Incompleto |
| ai-directory | Si | Si | Si | No | No | 3/5 | Incompleto |
| scorm | Si | Si | No | No | Si | 3/5 | Incompleto |
| tours | Si | Si | No | No | Si | 3/5 | Incompleto |
| landing | Si | No | No | No | Si | 2/5 | Deficiente |
| video-tracking | No | Si | No | No | Si | 2/5 | Deficiente |
| news | No | Si | Si | No | No | 2/5 | Deficiente |
| notifications | No | Si | Si | No | No | 2/5 | Deficiente |
| lia | Si | No | No | No | No | 1/5 | Minimo |
| purchases | No | Si | No | No | No | 1/5 | Minimo |

**Promedio de compliance: 2.7/5 (54%)**
- 0 features logran 5/5
- Solo 3 features logran 4/5
- 2 features estan en 1/5

---

## 8. Roadmap de Remediacion Priorizado

### Fase 1 -- Estabilizar (Semanas 1-4): Red de Seguridad

**Objetivo:** Crear la base minima para poder refactorizar sin riesgo.

| # | Tarea | Impacto | Esfuerzo |
|---|-------|---------|----------|
| 1.1 | Instalar y configurar framework de testing (Vitest + React Testing Library) | Alto | Medio |
| 1.2 | Escribir smoke tests para los 10 archivos mas criticos (monolitos + auth + API routes) | Alto | Alto |
| 1.3 | Agregar ESLint al backend (`apps/api`) | Medio | Bajo |
| 1.4 | Mover `delete_user_manual.sql` fuera de migraciones a `scripts/` | Medio | Bajo |
| 1.5 | Reemplazar `as any` casts en auth middleware con tipos propios | Alto | Bajo |
| 1.6 | Estandarizar convencion de nombres de migraciones | Medio | Bajo |
| 1.7 | Remover `authStore` deprecado | Bajo | Bajo |

### Fase 2 -- Descomponer (Semanas 5-12): Romper los Monolitos

**Objetivo:** Reducir los archivos criticos a tamanos manejables (<500 lineas por componente).

| # | Tarea | Archivo | Meta |
|---|-------|---------|------|
| 2.1 | Descomponer `StudyPlannerLIA.tsx` (11,933 lineas) | `features/study-planner/components/` | 8-12 sub-componentes + hooks extraidos |
| 2.2 | Descomponer `courses/[slug]/learn/page.tsx` (10,448 lineas) | `features/courses/components/` | Mover logica a feature, pagina como wrapper delgado |
| 2.3 | Descomponer `AIChatAgent.tsx` (3,214 lineas) | `core/components/AIChatAgent/` | 5-6 componentes (ChatWindow, MessageList, InputBox, VoiceHandler, IntentDetector) |
| 2.4 | Descomponer `CourseManagementPage.tsx` (3,139 lineas) | `features/admin/components/` | Extraer modals, tablas, forms a componentes separados |
| 2.5 | Extraer logica de negocio de API routes gordas a service layer | `app/api/*/` | Cada route < 100 lineas, logica en services |
| 2.6 | Descomponer `StudyPlannerContext` (26 propiedades) | `features/study-planner/context/` | Dividir en contextos por dominio |
| 2.7 | Reemplazar 1,201 console.logs con utilidad de logging estructurado | Todo el proyecto | 0 console.logs en produccion |

### Fase 3 -- Endurecer (Semanas 13-20): Calidad y Compliance

**Objetivo:** Cerrar brechas de tipo, estilo, duplicacion y arquitectura.

| # | Tarea | Impacto |
|---|-------|---------|
| 3.1 | Eliminar los 223+ tipos `any` -- agregar interfaces propias | Alto |
| 3.2 | Agregar `types.ts` e `index.ts` a las 21 features | Medio |
| 3.3 | Reemplazar 255 archivos de colores hardcodeados con tokens de tema | Medio |
| 3.4 | Consolidar utilidades duplicadas (packages/shared vs apps/api) | Bajo |
| 3.5 | Consolidar 3 servicios de traduccion en 1 unificado | Medio |
| 3.6 | Eliminar API routes duplicadas (business/reports/data) | Bajo |
| 3.7 | Alcanzar 40% cobertura de tests en paths criticos | Alto |
| 3.8 | Resolver 105 TODO/FIXME o documentarlos como issues | Medio |

### Fase 4 -- Evolucionar (Semanas 21-28): Backend y Observabilidad

**Objetivo:** Completar infraestructura y preparar para escala.

| # | Tarea | Impacto |
|---|-------|---------|
| 4.1 | Implementar backend Express (controllers, services, models) | Alto |
| 4.2 | Agregar logging estructurado y observabilidad (correlation IDs, metricas) | Alto |
| 4.3 | Agregar documentacion de API (OpenAPI/Swagger) | Medio |
| 4.4 | Implementar estrategia de rollback para migraciones | Medio |
| 4.5 | Implementar validacion de requests con middleware Zod | Alto |
| 4.6 | Alcanzar 70% cobertura de tests | Alto |
| 4.7 | Implementar hierarchical auth con queries reales a Supabase (no placeholders) | Critico |

---

## 9. Metricas de Seguimiento

Metricas clave para rastrear el progreso de remediacion:

| Metrica | Actual | Meta Fase 1 | Meta Fase 2 | Meta Fase 3 | Meta Fase 4 |
|---------|--------|-------------|-------------|-------------|-------------|
| **TDI (Indice de Deuda)** | 66% | 58% | 45% | 30% | 20% |
| **Cobertura de tests** | ~0.2% | 10% | 25% | 40% | 70% |
| **Archivos >500 lineas** | 30+ | 28 | 10 | 5 | <3 |
| **Tipos `any`** | 223+ | 200 | 100 | 0 | 0 |
| **Console.logs** | 1,201 | 1,000 | 0 | 0 | 0 |
| **Feature compliance (x/5)** | 2.7/5 | 2.7/5 | 3.5/5 | 4.5/5 | 5/5 |
| **API routes >300 lineas** | 8+ | 8 | 2 | 0 | 0 |
| **Colores hardcodeados** | 255 files | 255 | 200 | 0 | 0 |

---

## 10. Apendices

### Apendice A: Top 30 Archivos mas Grandes

| # | Archivo | Lineas | Tipo |
|---|---------|--------|------|
| 1 | `apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx` | 11,933 | Componente |
| 2 | `apps/web/src/app/courses/[slug]/learn/page.tsx` | 10,448 | Pagina |
| 3 | `apps/web/src/lib/supabase/types.ts` | 9,063 | Tipos (auto-gen) |
| 4 | `apps/web/src/core/components/AIChatAgent/AIChatAgent.tsx` | 3,214 | Componente |
| 5 | `apps/web/src/features/admin/components/CourseManagementPage.tsx` | 3,139 | Componente |
| 6 | `apps/web/src/lib/lia-context/config/page-metadata.ts` | 2,919 | Config |
| 7 | `apps/web/src/app/api/study-planner/dashboard/chat/route.ts` | 2,856 | API Route |
| 8 | `apps/web/src/features/business-panel/components/BusinessSettings.tsx` | 2,603 | Componente |
| 9 | `apps/web/src/app/api/ai-chat/route.ts` | 2,595 | API Route |
| 10 | `apps/web/src/core/components/LiaSidePanel.tsx` | 2,087 | Componente |
| 11 | `apps/web/src/app/[orgSlug]/business-panel/users/page.tsx` | 2,058 | Pagina |
| 12 | `apps/web/src/features/study-planner/components/StudyPlannerCalendar.tsx` | 1,729 | Componente |
| 13 | `apps/web/src/app/admin/companies/[id]/edit/page.tsx` | 1,657 | Pagina |
| 14 | `apps/web/src/features/study-planner/services/calendar-integration.service.ts` | 1,618 | Servicio |
| 15 | `apps/web/src/app/study-planner/dashboard/page.tsx` | 1,583 | Pagina |
| 16 | `apps/web/src/features/instructor/components/InstructorCourseManagementPage.tsx` | 1,445 | Componente |
| 17 | `apps/web/src/features/business-panel/components/hierarchy/HierarchyForms.tsx` | 1,441 | Componente |
| 18 | `apps/web/src/app/api/lia/chat/route.ts` | ~1,421 | API Route |
| 19 | `apps/web/src/features/study-planner/services/lia-context.service.ts` | 1,271 | Servicio |
| 20 | `apps/web/src/features/business-panel/components/BusinessUserStatsModal.tsx` | 1,260 | Componente |
| 21 | `apps/web/src/features/business-panel/components/BusinessUnifiedInviteModal.tsx` | 1,224 | Componente |
| 22 | `apps/web/src/features/business-panel/components/BusinessReports.tsx` | 1,219 | Componente |
| 23 | `apps/web/src/features/admin/components/AdminUnifiedInviteModal.tsx` | 1,197 | Componente |
| 24 | `apps/web/src/features/notifications/services/auto-notifications.service.ts` | 1,187 | Servicio |
| 25 | `apps/web/src/features/business-panel/components/BusinessThemeCustomizer.tsx` | 1,155 | Componente |
| 26 | `apps/web/src/features/admin/components/AdminCompaniesPage.tsx` | 1,134 | Componente |
| 27 | `apps/web/src/features/study-planner/services/user-context.service.ts` | 1,127 | Servicio |
| 28 | `apps/web/src/features/auth/actions/oauth.ts` | 1,122 | Action |
| 29 | `apps/web/src/features/business-panel/components/BusinessAnalytics.tsx` | 1,105 | Componente |
| 30 | `apps/web/src/app/api/[orgSlug]/business/reports/data/route.ts` | 1,084 | API Route |

### Apendice B: Reglas de prompt_maestro.md Violadas

| Seccion | Regla | Violacion | Archivos Afectados |
|---------|-------|-----------|--------------------|
| 2 | "No crees archivos gigantes con multiples responsabilidades" | 30+ archivos sobre 500 lineas | 30+ |
| 2 | "No mezcles responsabilidades en un mismo archivo" | Componentes con UI + logica + estado + API | 15+ |
| 2 | "No hagas logica de negocio incrustada en controladores" | API routes con queries, transformaciones, formato | 8+ |
| 2 | "No dejes codigo muerto, duplicado o commented-out" | Console.logs, TODOs, imports comentados, authStore deprecado | 200+ |
| 2 | "No uses nombres pobres como temp, data, obj" | Tipos `any` usados como escape | 50+ |
| 3 | "Responsabilidad unica por modulo, clase, servicio o funcion" | God objects, mega-componentes | 10+ |
| 4 | "Separa presentacion, handlers, servicios, validaciones" | Fat API routes, componentes con todo mezclado | 20+ |
| 5 | "Controla migraciones de forma segura, reversible y explicita" | Sin rollback, nombres mixtos, scripts destructivos | 52 migraciones |
| 7 | "No asumas seguridad por defecto" | `as any` en auth, hierarchical auth sin implementar | 3+ |
| 9 | "Todo cambio debe contemplar calidad verificable" | ~0.2% cobertura de tests | Todo el proyecto |
| 10 | "Logs estructurados, niveles correctos, correlation IDs" | 1,201 console.logs, sin logging framework | 157 archivos |

### Apendice C: Estado del Backend (apps/api/)

| Componente | Estado | Lineas |
|------------|--------|--------|
| Entry point (`index.ts`) | Funcional pero con rutas placeholder | 108 |
| Env config (`config/env.ts`) | Bien implementado con Zod | 221 |
| CORS (`middleware/secure-cors.ts`) | Bien implementado | 162 |
| Auth middleware (`middlewares/auth.ts`) | Funcional, 2x `as any` | 102 |
| Error handler (`middlewares/errorHandler.ts`) | Bien implementado | 127 |
| Hierarchical auth (`middlewares/hierarchicalAuth.ts`) | Placeholder (TODO: queries a DB) | 555 |
| Shared constants | Correctos | 97 |
| Shared utils | Duplicados con packages/shared | 117 |
| **Controllers** | **NO EXISTEN** | 0 |
| **Services** | **NO EXISTEN** | 0 |
| **Models** | **NO EXISTEN** | 0 |
| **Tests** | **NO EXISTEN** | 0 |
| **ESLint config** | **NO EXISTE** | 0 |
| **Total** | **8% implementado** | **1,489** |

### Apendice D: Migraciones Problematicas

| Archivo | Problema |
|---------|----------|
| `001_create_user_tour_progress.sql` | Duplicado de numero con el siguiente |
| `001_add_organization_id_to_tables.sql` | Duplicado de numero -- orden de ejecucion indefinido |
| `BD.sql` | Nombre vago, no sigue convencion |
| `Database.sql` | Nombre generico, no sigue convencion |
| `Database_Optimizations.sql` | Duplica esfuerzo con archivos de optimizacion con timestamp |
| `delete_user_manual.sql` | **Script destructivo en carpeta de migraciones** |
| Convencion mixta | 4 archivos `001-004_*`, 38+ archivos `20250108_*`, 7+ archivos con nombre libre |

---

> **Nota final:** Este analisis es un snapshot del estado actual del proyecto. Los porcentajes y conteos son aproximaciones basadas en la exploracion del codigo fuente. Se recomienda ejecutar herramientas automatizadas (SonarQube, CodeClimate, ESLint con reglas estrictas) para obtener metricas exactas y rastrear la evolucion en el tiempo.
