# PROMPT 1 — Tour de Página (basado en capturas de pantalla)

> **Cómo usar este prompt:**
> 1. Pega el contenido completo de `prompt_maestro.md`.
> 2. Pega este archivo completo.
> 3. Adjunta una o varias capturas de pantalla de la página o panel donde quieres el tour.
>    No expliques la ruta, el rol, el archivo, el módulo, el TOUR_ID ni los elementos:
>    el agente debe inferirlos desde las imágenes y validarlos contra el código.
> 4. Ejecutar SOLO después de que el Agente 0 (infraestructura) haya finalizado.

---

## ESTÁNDARES DE INGENIERÍA

Antes de comenzar, aplica todas las reglas de `prompt_maestro.md`.
Trabaja con criterio de Staff Engineer / Principal Engineer.
Tu tarea es puntual: implementar el tour de UNA PÁGINA sin romper nada más.
No entregues solo código: entrega una solución modular, sin deuda técnica,
tipada, i18n-completa y responsive.

---

## CONTEXTO DEL PROYECTO

**Proyecto:** SofLIA Learning — plataforma B2B de formación corporativa con IA.

**Stack:** Next.js 15, React 18, TypeScript 5 strict, TailwindCSS 3.4, Zustand 5,
react-joyride 3.1, lucide-react, Framer Motion 12.

**Raíz del frontend:** `apps/web/src/`

**Aliases de paths:**

```
@/*            → apps/web/src/*
@/features/*   → apps/web/src/features/*
@/core/*       → apps/web/src/core/*
```

**Infraestructura de tours disponible en `@/features/tours`:**

```typescript
import { useTour, TourTriggerButton } from '@/features/tours'
import type { TourConfig } from '@/features/tours'
```

**Convención de target (CRÍTICO — nunca selectores de clase):**

```
Atributo HTML:  data-tour-id="TOUR_ID--nombre-elemento"
Selector CSS:  '[data-tour-id="TOUR_ID--nombre-elemento"]'
```

**Reglas irrompibles:**

- NUNCA hardcode de strings visibles. Todo vía `t()` con clave en namespace `tours`.
- NUNCA hardcode de colores hex en JSX. Solo Tailwind y CSS variables.
- Dark/light mode siempre soportado en lo que modifiques.
- Sin modificar lógica de negocio existente. Solo añadir `data-tour-id` y el hook.
- `npm run type-check --workspace=apps/web` debe pasar sin errores nuevos.

---

## TU TAREA

Se te proporcionan **una o varias capturas de pantalla** de una página o panel de SofLIA Learning.
Las imágenes son el briefing completo. No esperes que el usuario te diga el contexto,
la ruta, el nombre técnico de la página ni qué componentes debe cubrir el tour.
Tu trabajo es:

1. Analizar visualmente las capturas e identificar TODOS los elementos funcionales.
2. Inferir qué página/panel es, qué rol la usa y cuál debe ser su TOUR_ID.
3. Localizar los archivos de código correspondientes a esa página.
4. Implementar el tour completo para esa página.

No pidas contexto adicional salvo que las imágenes sean ilegibles o muestren dos páginas
indistinguibles que puedan llevar a implementar el tour en una ruta equivocada.
Primero intenta resolver cualquier ambigüedad con el texto visible, la navegación,
los títulos, los iconos, la URL si aparece y una búsqueda cuidadosa en el código.

---

## PROCESO DE IMPLEMENTACIÓN (seguir en este orden exacto)

### PASO 1 — Analiza las capturas de pantalla

Examina cada captura con detalle como si fuera la única especificación disponible.
Haz una lectura visual completa antes de abrir archivos. Identifica y lista:

**De la UI visible:**

- El nombre o título del panel/página (visible en el header o en la barra del navegador)
- Cada sección o card principal
- Botones de acción primaria y secundaria (crear, invitar, exportar, filtrar, etc.)
- Barras de búsqueda y filtros
- Tablas, listas o grids de datos
- Gráficas, métricas o KPIs
- Tabs o navegación interna del panel
- Modales o paneles laterales con trigger visible
- El botón flotante de SofLIA (si aparece)
- Cualquier elemento de navegación o configuración

**De la URL o título visible:**
Determina a qué ruta corresponde la página. Ejemplos:
`/[orgSlug]/business-user/dashboard` → tour ID: `business-user-dashboard`
`/[orgSlug]/business-panel/users` → tour ID: `business-panel-users`

Si la URL no es visible, infiere la ruta por el contenido y diseño del panel.
Usa también migas de pan, títulos, textos de botones, columnas de tablas, menú lateral,
iconos y nombres de secciones para deducir el área funcional.

**Regla image-first:**
No solicites al usuario que describa la pantalla. Si falta una ruta explícita,
formula una hipótesis razonada y confírmala leyendo el código.

---

### PASO 2 — Mapea la página a su TOUR_ID

Usando lo identificado en el Paso 1, asigna el TOUR_ID correcto de esta lista:

| Página visible | TOUR_ID | I18N_SUB_KEY |
|---|---|---|
| Dashboard del usuario de negocio | `business-user-dashboard` | `businessUserDashboard` |
| Panel de negocio (home/overview) | `business-panel-dashboard` | `businessPanelDashboard` |
| Gestión de usuarios del panel de negocio | `business-panel-users` | `businessPanelUsers` |
| Reportes del panel de negocio | `business-panel-reports` | `businessPanelReports` |
| Analytics del panel de negocio | `business-panel-analytics` | `businessPanelAnalytics` |
| Rutas de aprendizaje (business panel) | `business-panel-learning-paths` | `businessPanelLearningPaths` |
| Analytics personal del usuario de negocio | `business-user-analytics` | `businessUserAnalytics` |
| Dashboard del Study Planner | `study-planner-dashboard` | `studyPlannerDashboard` |
| Página de aprendizaje de curso | `course-learn` | `courseLearn` |
| Dashboard del admin | `admin-dashboard` | `adminDashboard` |
| Gestión de usuarios del admin | `admin-users` | `adminUsers` |
| Gestión de empresas del admin | `admin-companies` | `adminCompanies` |
| Dashboard general del usuario | `user-dashboard` | `userDashboard` |
| Perfil del usuario | `user-profile` | `userProfile` |

Si la página no está en esta lista, crea un TOUR_ID en kebab-case
(`nombre-de-la-pagina`) y su I18N_SUB_KEY en camelCase (`nombreDeLaPagina`).

---

### PASO 3 — Localiza los archivos de código

Con el TOUR_ID determinado, busca los archivos correspondientes en el proyecto.
La búsqueda debe partir de lo que viste en las imágenes: títulos visibles, etiquetas,
textos de botones, nombres de columnas, elementos del menú y rutas inferidas.

**Estrategia de búsqueda (en este orden):**

1. Mira el TOUR_ID y mapea la ruta: `business-panel-users` → `/[orgSlug]/business-panel/users`
2. Busca el archivo: `apps/web/src/app/[segmento]/page.tsx`
3. Desde ese `page.tsx`, sigue los imports para encontrar el componente principal
   (usualmente en `features/[feature]/components/`)
4. Lee ese componente raíz y todos sus sub-componentes directos
5. Lee el layout del segmento (`layout.tsx`) para entender el contexto completo

**Lee TODOS los archivos relevantes antes de continuar.**
No asumas qué hay en el código. Si lo que ves en la captura no coincide con
el código que encuentras, el código manda.

---

### PASO 4 — Define los steps del tour

Cruza lo que viste en la captura con lo que encontraste en el código.
Para cada elemento visual que tenga un componente correspondiente en el código,
crea un step.

**Reglas obligatorias:**

- Mínimo 6 steps, máximo 15 steps
- **Step 0 (bienvenida):** apunta al contenedor principal de la página.
  Presenta el propósito del panel en 1-2 oraciones.
- **Último step:** apunta al botón flotante de SofLIA
  (`[data-tour-id="soflia-floating-button"]`) si está en el layout.
  Si no está, apuntar a configuración o soporte.
- `placement: 'auto'` por defecto. Solo cambiar si el elemento está en borde de pantalla.
- `disableBeacon: true` en todos (los beacons parpadeantes son distractores).
- `optional: true` para elementos que aparecen condicionalmente
  (modales, botones que dependen de permisos, secciones que no siempre están).

**Si en la captura ves un elemento pero no encuentras su `data-tour-id` target
obvio en el código**, no inventes — márcalo como `optional: true` y usa el
contenedor padre más cercano que sí existe.

**Contenido de cada step:**

- Título: máx 5 palabras, descriptivo del elemento
- Contenido: 1-2 oraciones claras. ¿QUÉ es? ¿PARA QUÉ sirve?
- Tono: amigable, profesional, segunda persona
- Sin jerga técnica, sin nombres de variables, sin referencias a código

---

### PASO 5 — Añade `data-tour-id` a los componentes

Para cada step, añadir el atributo al elemento HTML semántico correcto
en el archivo de código correspondiente.

**Convención:**

```
data-tour-id="TOUR_ID--nombre-descriptivo"
```

Ejemplos para `business-panel-users`:

```tsx
<section data-tour-id="business-panel-users--stats-grid">
<button data-tour-id="business-panel-users--invite-button">
<div data-tour-id="business-panel-users--users-table">
<input data-tour-id="business-panel-users--search-bar">
```

**Reglas:**

- Añadir SOLO al elemento contenedor más semántico (no a elementos internos)
- NO añadir a elementos con `position: fixed` o `position: absolute` si pueden
  quedar parcialmente fuera del viewport
- NO reemplazar ids de React existentes — añadir `data-tour-id` junto a ellos
- NO modificar lógica, estado, eventos ni clases CSS existentes
- Si en la captura ves el elemento pero el componente renderiza condicionalmente,
  marcar el step como `optional: true` en el config

---

### PASO 6 — Crea el archivo de configuración del tour

Ruta: `apps/web/src/features/tours/config/TOUR_ID.tour.ts`

```typescript
import type { TourConfig } from '@/features/tours'

export const tourIdCamelTour: TourConfig = {
  id: 'tour-id',
  autoStart: true,
  steps: [
    {
      target: '[data-tour-id="tour-id--elemento-bienvenida"]',
      titleKey: 'tours.i18nSubKey.welcome.title',
      contentKey: 'tours.i18nSubKey.welcome.content',
      placement: 'bottom',
      disableBeacon: true,
    },
    // ... resto de steps en el mismo patrón
    {
      target: '[data-tour-id="tour-id--soflia-button"]',
      titleKey: 'tours.i18nSubKey.soflia.title',
      contentKey: 'tours.i18nSubKey.soflia.content',
      placement: 'left',
      disableBeacon: true,
      optional: true,
    },
  ],
}
```

El archivo de config no debe superar 80 líneas.
Sin lógica, sin imports de React, sin efectos secundarios. Solo datos.

---

### PASO 7 — Conecta el hook `useTour` al componente de página

En el componente raíz de la página (el primero que tenga o necesite `'use client'`):

```typescript
import { useTour, TourTriggerButton } from '@/features/tours'
import { tourIdCamelTour } from '@/features/tours/config/tour-id.tour'

// Junto a los demás hooks del componente:
const { restartTour, autoStartIfNeeded } = useTour(tourIdCamelTour)

useEffect(() => {
  autoStartIfNeeded()
}, [autoStartIfNeeded])
```

**Si el componente raíz es un Server Component** (sin `'use client'`):
Crear un sub-componente `NombrePaginaTourWrapper.tsx` como Client Component
que solo contenga el hook y el `TourTriggerButton`. Montarlo dentro del
Server Component. No convertir el Server Component en Client Component.

---

### PASO 8 — Añade el `TourTriggerButton` al header

Localiza el header o barra de título del panel y añadir el botón:

```tsx
<TourTriggerButton onStart={restartTour} className="ml-2 flex-shrink-0" />
```

**Posicionamiento:** visible en la parte superior del panel, junto al título
o en la barra de acciones. Que no rompa el layout en ningún breakpoint.
En mobile debe mantenerse accesible (no quedar oculto ni desplazado).

Si en la captura identificas un header o barra de título, coloca el botón ahí.
Si no hay un header claro, busca el área superior del componente raíz.

---

### PASO 9 — Añade las traducciones i18n

En cada uno de los tres archivos, agregar **únicamente** la sub-clave `I18N_SUB_KEY`.
No tocar ninguna clave existente. Agregar antes del cierre `}` del JSON.

**Estructura (adaptar al número real de steps):**

`apps/web/public/locales/es/tours.json`:

```json
{
  "i18nSubKey": {
    "welcome": {
      "title": "Bienvenido al panel",
      "content": "Descripción del panel y su propósito."
    },
    "stepDos": {
      "title": "Nombre del elemento",
      "content": "Qué es y para qué sirve este elemento."
    },
    "soflia": {
      "title": "Tu asistente SofLIA",
      "content": "SofLIA es tu asistente de IA. Puedes preguntarle sobre tu progreso, cursos o cualquier duda en cualquier momento."
    }
  }
}
```

`apps/web/public/locales/en/tours.json` y `pt/tours.json`:
Traducciones **reales**, no copias del español.
EN: inglés natural. PT: portugués natural.

---

## GUÍA VISUAL — cómo mapear lo que ves a steps

Usa estas referencias al analizar las capturas:

**Si ves tarjetas de métricas/KPIs** → 1 step por grupo de métricas relacionadas

**Si ves una tabla con datos** → 1 step para la tabla completa
(describir qué muestra y cómo usar los filtros/acciones de fila)

**Si ves botones de acción primaria** (Invitar, Crear, Exportar) → 1 step cada uno
si son acciones clave; agrupar si son secundarias

**Si ves un selector de fechas o filtros** → 1 step describiendo cómo filtrar

**Si ves gráficas** → 1 step por gráfica o grupo de gráficas relacionadas

**Si ves tabs** → 1 step en la tab activa explicando el sistema de tabs completo

**Si ves un chat de IA** (SofLIA o Gemini) → 1 step destacando el asistente

**Si ves navegación lateral propia del panel** → 1 step de contexto general

**Si ves elementos que no están activos en la captura** (disabled, ocultos):
No crear steps para ellos, o marcar como `optional: true` si tienen valor educativo.

---

## VALIDACIÓN FINAL

Antes de terminar, verificar:

- [ ] Cada elemento visible en la captura tiene su step correspondiente
- [ ] Los targets en `.tour.ts` coinciden 1:1 con los `data-tour-id` añadidos en el código
- [ ] ES, EN y PT tienen la sub-clave con traducciones reales (no copias)
- [ ] `TourTriggerButton` es visible en desktop y mobile sin romper el layout
- [ ] `autoStart: true` en el config
- [ ] El import del config en el componente de página resuelve correctamente
- [ ] Si el componente raíz era Server Component, se creó el wrapper Client Component
- [ ] No se modificó lógica, clases CSS ni estado existente
- [ ] `npm run type-check --workspace=apps/web` sin errores nuevos
- [ ] Todos los `data-tour-id` usan el prefijo correcto: `"TOUR_ID--"`
- [ ] Último step apunta a SofLIA o a elemento de soporte/configuración
