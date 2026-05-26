# PROMPT 0 — Infraestructura del Sistema de Tours

> **Cómo usar este prompt:**
> Pega primero el contenido completo de `prompt_maestro.md` y luego el contenido de este archivo.
> Este agente debe terminar completamente antes de ejecutar cualquier agente de página.

---

## ESTÁNDARES DE INGENIERÍA

Antes de comenzar, lee y aplica todas las reglas de `prompt_maestro.md`.
Trabaja con criterio de Staff Engineer / Principal Engineer.
Cada decisión técnica debe estar justificada por los criterios de calidad, seguridad,
modularidad y mantenibilidad definidos en ese documento.
No entregues solo código: entrega una solución profesional, robusta, clara, segura,
testeable, escalable y entendible.

---

## CONTEXTO DEL PROYECTO

**Proyecto:** SofLIA Learning — plataforma B2B de formación corporativa con IA.

**Stack:**
- Next.js 15, React 18, TypeScript 5 (strict: true)
- TailwindCSS 3.4 — NUNCA hardcode de colores hex en JSX o clases
- Zustand 5.0 — gestión de estado global
- react-joyride 3.1 — librería de tours (ya instalada)
- react-i18next / next-i18next — i18n client-bundled (es/en/pt)
- Framer Motion 12 — animaciones
- lucide-react — iconos (ya instalado)
- Monorepo: apps/web (frontend), apps/api (backend), packages/shared

**Raíz del frontend:** `apps/web/src/`

**Aliases de paths (tsconfig):**
```
@/*            → apps/web/src/*
@/features/*   → apps/web/src/features/*
@/core/*       → apps/web/src/core/*
@/components/* → apps/web/src/shared/components/*
```

**Paleta de colores (CSS variables definidas en globals.css):**
```
--color-primary: #0A2540   → usar inline style o bg-[#0A2540] solo en config Joyride
--color-accent:  #00D4B3   → text-teal-400 / bg-teal-400 en Tailwind
--color-bg-dark: #0F1419   → bg-gray-900
gray-800 dark:              → bg-gray-800 (equivale a #1E2329)
```
Los colores hex solo están permitidos dentro del objeto `styles` de la configuración
de react-joyride. En todos los demás lugares usar clases Tailwind.

**Patrón de Zustand existente:**
Leer `apps/web/src/core/stores/themeStore.ts` para entender el patrón.
Usar: `create<State>()(persist(...))` con middleware persist de zustand.
Los stores van en `apps/web/src/core/stores/` (este es el store de tema referencia).
El tour store irá en `apps/web/src/features/tours/tour.store.ts` (dentro del feature).

**Sistema i18n existente:**
Leer `apps/web/src/core/i18n/i18n.ts` antes de modificarlo.
Todos los namespaces se importan estáticamente y se registran en ese archivo.
El namespace nuevo `tours` debe seguir exactamente el mismo patrón.

**Referencia de tema:**
`useThemeStore()` de `@/core/stores/themeStore` → `{ resolvedTheme: 'light' | 'dark' }`

**Convenciones de código:**
- Archivos: kebab-case (`tour-tooltip.tsx`)
- Componentes: PascalCase (`TourTooltip`)
- `'use client'` solo donde sea estrictamente necesario (hooks, eventos, browser APIs)
- Componentes > 300 líneas se dividen en sub-componentes
- Sin comentarios obvios. Solo donde el WHY no es deducible del código

---

## OBJETIVO

Construir la infraestructura completa y reutilizable del sistema de tours de onboarding
para SofLIA Learning. Esta infraestructura será consumida por múltiples agentes que
implementarán un tour por página.

**Requisito crítico de extensibilidad:**
Agregar un tour nuevo NO debe requerir modificar ningún archivo de infraestructura.
Cada tour nuevo es un archivo de configuración autocontenido.

---

## ESTRUCTURA DE ARCHIVOS A CREAR

```
apps/web/src/features/tours/
├── index.ts                     ← barrel export público del feature
├── types.ts                     ← todos los tipos compartidos
├── tour.store.ts                ← Zustand store (estado del tour activo + persistencia)
├── TourProvider.tsx             ← Provider: envuelve children + monta TourRenderer
├── components/
│   ├── TourRenderer.tsx         ← wrapper de react-joyride (consume el store)
│   ├── TourTooltip.tsx          ← tooltip custom (componente UI principal)
│   ├── TourTriggerButton.tsx    ← botón reutilizable para reiniciar el tour
│   └── TourProgress.tsx        ← indicador de progreso (dots o "N / Total")
├── hooks/
│   ├── useTour.ts               ← hook para que cada página consuma su tour
│   └── useTourPersistence.ts   ← encapsula acceso a completedTours del store
└── utils/
    └── tour.helpers.ts          ← funciones puras: isMobile, filterValidSteps, resolveStepPlacement

apps/web/public/locales/
├── es/tours.json
├── en/tours.json
└── pt/tours.json
```

---

## ESPECIFICACIÓN TÉCNICA

### types.ts

Define exactamente estos tipos. No añadir más de lo necesario.

```typescript
// Un TourId por página/panel. Los agentes de página NO modifican este archivo.
// Todos los IDs están pre-definidos aquí para evitar conflictos entre agentes.
export type TourId =
  | 'business-user-dashboard'
  | 'business-panel-dashboard'
  | 'business-panel-users'
  | 'business-panel-reports'
  | 'business-panel-analytics'
  | 'business-panel-learning-paths'
  | 'business-user-analytics'
  | 'study-planner-dashboard'
  | 'course-learn'
  | 'admin-dashboard'
  | 'admin-users'
  | 'admin-companies'
  | 'user-dashboard'
  | 'user-profile'

export type TourPlacement =
  | 'top' | 'top-start' | 'top-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'left' | 'right' | 'center' | 'auto'

export interface TourStep {
  /** Selector CSS. SIEMPRE usar [data-tour-id="valor"]. Nunca selectores de clase. */
  target: string
  /** Clave i18n. Formato: 'tours.PAGINA.STEP.title' */
  titleKey: string
  /** Clave i18n. Formato: 'tours.PAGINA.STEP.content' */
  contentKey: string
  placement?: TourPlacement
  spotlightClicks?: boolean
  disableBeacon?: boolean
  /** true = se omite el step si el target no está en el DOM (elemento condicional) */
  optional?: boolean
}

export interface TourConfig {
  id: TourId
  steps: TourStep[]
  /** Si true, el tour se inicia automáticamente la primera vez que el usuario entra */
  autoStart?: boolean
}

export interface TourStoreState {
  activeTourConfig: TourConfig | null
  currentStep: number
  isRunning: boolean
  // Persistido en localStorage
  completedTours: TourId[]
}

export interface TourStoreActions {
  startTour: (config: TourConfig) => void
  stopTour: () => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  markCompleted: (id: TourId) => void
  hasCompleted: (id: TourId) => boolean
  resetTour: (id: TourId) => void
}

export type TourState = TourStoreState & TourStoreActions
```

---

### tour.store.ts

```typescript
'use client'

// Patrón idéntico a themeStore.ts.
// create<TourState>()(persist(...))
// Clave de persistencia: 'soflia:tours'
// partialize: persistir SOLO completedTours. El estado de sesión no se persiste.
//
// Estado de sesión (no persistido, se resetea al recargar):
//   activeTourConfig: null
//   currentStep: 0
//   isRunning: false
//
// Acciones:
//   startTour(config): si ya isRunning, no hacer nada. Setear activeTourConfig,
//                      currentStep=0, isRunning=true
//   stopTour():        isRunning=false, activeTourConfig=null, currentStep=0
//   nextStep():        currentStep + 1 (no exceder totalSteps - 1)
//   prevStep():        currentStep - 1 (no bajar de 0)
//   goToStep(n):       setear currentStep = n directamente
//   markCompleted(id): agregar id a completedTours si no está ya
//   hasCompleted(id):  retornar completedTours.includes(id)
//   resetTour(id):     filtrar id fuera de completedTours
```

---

### utils/tour.helpers.ts

Funciones puras sin side effects. Sin acceso al store.

```typescript
// isMobileViewport(): boolean
//   Retorna true si window.innerWidth < 768.
//   Guard de SSR: retornar false si typeof window === 'undefined'.

// filterValidSteps(steps: TourStep[]): TourStep[]
//   Elimina steps cuyo target no existe en el DOM Y no son optional.
//   Usa document.querySelector(step.target) para verificar.
//   Guard de SSR: retornar steps sin filtrar si typeof document === 'undefined'.

// resolveSteps(steps: TourStep[]): TourStep[]
//   Combina ambos filtros:
//   - Si optional=true y el target no existe → omitir el step
//   - Si optional=false y el target no existe → mantener el step (Joyride lo manejará)
//   Esto permite que steps opcionales (ej: botón de intro video) se omitan gracefully.

// resolveStepPlacement(step: TourStep, mobile: boolean): TourPlacement
//   En mobile (< 768px): convertir 'left' y 'right' → 'bottom'.
//   'auto', 'top', 'bottom', 'center' → sin cambio.
//   Esto evita que los tooltips queden fuera de la pantalla en mobile.

// CONSTANTE exportada:
// export const TOUR_AUTOSTART_DELAY_MS = 600
//   Delay en ms antes de auto-iniciar el tour (espera montaje del DOM).
```

---

### hooks/useTourPersistence.ts

Hook simple. Solo encapsula acceso a las acciones de persistencia del store.
No tiene lógica propia — es una capa de indirección para que los componentes
de página no importen el store directamente.

```typescript
// Retorna:
// hasCompleted(id: TourId): boolean
// markCompleted(id: TourId): void
// resetTour(id: TourId): void
```

---

### hooks/useTour.ts

Hook principal que cada página consume. Recibe el config del tour.

```typescript
// Firma:
// export function useTour(config: TourConfig): {
//   startTour: () => void
//   restartTour: () => void     ← reinicia aunque esté completado
//   stopTour: () => void
//   isRunning: boolean
//   currentStep: number
//   totalSteps: number          ← config.steps.length
//   hasCompleted: boolean
//   autoStartIfNeeded: () => void  ← ver abajo
// }
//
// autoStartIfNeeded():
//   Si config.autoStart === true Y !hasCompleted(config.id) Y !isRunning:
//     setTimeout(() => startTour(config), TOUR_AUTOSTART_DELAY_MS)
//   El componente de página llama esto dentro de un useEffect([]).
//   Usar useCallback para estabilizar la referencia.
//
// startTour():
//   Resolver steps válidos con resolveSteps() antes de llamar al store.
//   Pasar el config con los steps resueltos al store.
//
// restartTour():
//   Primero resetTour(config.id) para limpiar el estado de "completado".
//   Luego startTour().
```

---

### components/TourProgress.tsx

Indicador de progreso visual. Props: `{ current: number; total: number }`.

**Lógica de renderizado:**
- Si `total <= 8`: mostrar dots. Dot activo: `bg-teal-400 w-2 h-2`. Dots inactivos: `bg-gray-200 dark:bg-gray-600 w-1.5 h-1.5`. `gap-1.5`, centrado.
- Si `total > 8`: mostrar texto `t('tours.progress', { current: current + 1, total })`. `text-xs text-gray-400 dark:text-gray-500`.
- Usar `useThemeStore()` para el modo oscuro si las clases no son suficientes.

---

### components/TourTooltip.tsx

Tooltip custom que react-joyride inyecta en lugar del tooltip por defecto.
Recibe los props estándar de Joyride (`TooltipRenderProps` del tipo de joyride).

**Diseño (SOFIA design system):**
```
┌─────────────────────────────────────┐
│ [Ícono]  Título del step            │  ← font-semibold text-gray-900 dark:text-white
├─────────────────────────────────────┤  ← border-b border-gray-100 dark:border-white/10
│ Contenido descriptivo del elemento  │  ← text-sm text-gray-600 dark:text-gray-300
│ que está siendo explicado.          │    leading-relaxed
├─────────────────────────────────────┤
│ ● ● ○ ○  [Omitir]  [← Atrás] [Sig →]│  ← TourProgress + botones
└─────────────────────────────────────┘
```

**Clases del contenedor:**
`bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10`
`rounded-2xl shadow-2xl p-5 min-w-[280px] max-w-[360px]`

**En mobile (< 768px):** `max-w-[calc(100vw-32px)] p-4`

**Botones:**
- Skip: solo visible en el primer step. `text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 underline cursor-pointer`. Llama `closeProps.onClick`.
- Atrás: deshabilitado en step 0. Ghost, `text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-3 py-1.5 rounded-lg disabled:opacity-40`.
- Siguiente / Finalizar: `bg-[#0A2540] text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:opacity-90 focus-visible:ring-2 focus-visible:ring-teal-400 transition-opacity`.
  - Texto "Finalizar" en el último step: `t('tours.actions.finish')`.
  - Texto "Siguiente" en los demás: `t('tours.actions.next')`.

**Ícono en header:** Usar `Sparkles` de lucide-react, tamaño 16, color `text-teal-400`. Representa el asistente SofLIA.

**Usar `useTranslation('tours')` dentro del componente.**
**Usar `useThemeStore()` para resolvedTheme si es necesario para lógica.**
**Usar `isMobileViewport()` de tour.helpers para ajustar clases condicionalmente.**

No superar 250 líneas. Si crece, extraer sub-componentes `TourTooltipHeader` y `TourTooltipFooter`.

---

### components/TourTriggerButton.tsx

Botón reutilizable para que cada página ofrezca "repetir el tour".

```typescript
interface TourTriggerButtonProps {
  onStart: () => void
  className?: string
}
```

**Diseño:**
- Ícono `HelpCircle` de lucide-react, tamaño 20.
- Variante compacta: solo ícono en círculo `w-8 h-8`.
- `text-gray-400 hover:text-teal-400 dark:text-gray-500 dark:hover:text-teal-400 transition-colors`
- `aria-label={t('tours.actions.restart')}` (accesible).
- `title={t('tours.actions.restart')}` (tooltip nativo del browser).
- `useTranslation('tours')` dentro del componente.

---

### components/TourRenderer.tsx

Wrapper de react-joyride. Componente 'use client'.

**Responsabilidades:**
1. Leer del store: `activeTourConfig`, `currentStep`, `isRunning`.
2. Leer `resolvedTheme` de `useThemeStore()`.
3. Resolver steps válidos con `resolveSteps()` y `resolveStepPlacement()`.
4. Construir el objeto `steps` para Joyride (mapear `TourStep` → `Step` de joyride).
5. Manejar el callback de Joyride y traducir eventos al store:
   - `STATUS.FINISHED` → `markCompleted(id)` + `stopTour()`
   - `STATUS.SKIPPED`  → `stopTour()` (sin marcar como completado)
   - `EVENTS.STEP_AFTER` + `ACTIONS.NEXT` → `nextStep()`
   - `EVENTS.STEP_AFTER` + `ACTIONS.PREV` → `prevStep()`
6. Pasar `TourTooltip` como `tooltipComponent`.
7. Si `!isRunning || !activeTourConfig` → retornar null (no renderizar Joyride).

**Configuración de Joyride:**
```typescript
{
  run: isRunning,
  steps: resolvedJoyrideSteps,
  stepIndex: currentStep,
  continuous: true,
  showSkipButton: false,       // manejado dentro de TourTooltip
  showProgress: false,          // manejado por TourProgress
  disableOverlayClose: true,
  spotlightClicks: false,
  scrollToFirstStep: true,
  scrollOffset: 120,            // espacio para headers sticky
  floaterProps: {
    disableAnimation: false,
    offset: 12,
  },
  tooltipComponent: TourTooltip,
  styles: {
    options: {
      arrowColor: isDark ? '#1E2329' : '#FFFFFF',
      backgroundColor: 'transparent',
      overlayColor: isMobile ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.55)',
      primaryColor: '#00D4B3',
      zIndex: 10000,
    },
    spotlight: {
      borderRadius: 10,
    },
  },
}
```

---

### TourProvider.tsx

Componente 'use client' simple.

```typescript
// Renderiza:
// <>
//   {children}
//   <TourRenderer />
// </>
//
// Nada más. Toda la lógica vive en el store y en TourRenderer.
```

**Añadir `<TourProvider>` a los siguientes layouts (leer cada archivo antes de modificarlo):**
- `apps/web/src/app/[orgSlug]/business-user/layout.tsx`
- `apps/web/src/app/[orgSlug]/business-panel/layout.tsx` (verificar si existe)
- `apps/web/src/app/admin/layout.tsx` (verificar si existe)
- `apps/web/src/app/study-planner/layout.tsx` (verificar si existe)
- `apps/web/src/app/(dashboard)/layout.tsx` (verificar si existe)

Para cada layout: importar `TourProvider` desde `@/features/tours` y envolver
el contenido con él. NO romper ninguna estructura existente.

---

### index.ts (barrel export)

Exportar públicamente:
```typescript
export { TourProvider } from './TourProvider'
export { TourTriggerButton } from './components/TourTriggerButton'
export { useTour } from './hooks/useTour'
export { useTourPersistence } from './hooks/useTourPersistence'
export type { TourId, TourConfig, TourStep, TourPlacement, TourState } from './types'
// TourRenderer y el store son privados del feature. No exportar.
```

---

### Archivos i18n

**Crear los tres archivos con estructura base** (las sub-claves de cada página las agregan los agentes de página):

`apps/web/public/locales/es/tours.json`:
```json
{
  "actions": {
    "next": "Siguiente",
    "back": "Atrás",
    "skip": "Omitir tour",
    "finish": "¡Entendido!",
    "restart": "Ver tour guiado",
    "startTour": "Iniciar tour"
  },
  "progress": "{{current}} de {{total}}"
}
```

`apps/web/public/locales/en/tours.json`:
```json
{
  "actions": {
    "next": "Next",
    "back": "Back",
    "skip": "Skip tour",
    "finish": "Got it!",
    "restart": "View guided tour",
    "startTour": "Start tour"
  },
  "progress": "{{current}} of {{total}}"
}
```

`apps/web/public/locales/pt/tours.json`:
```json
{
  "actions": {
    "next": "Próximo",
    "back": "Anterior",
    "skip": "Pular tour",
    "finish": "Entendido!",
    "restart": "Ver tour guiado",
    "startTour": "Iniciar tour"
  },
  "progress": "{{current}} de {{total}}"
}
```

**Registrar en `apps/web/src/core/i18n/i18n.ts`:**
Seguir exactamente el patrón de los namespaces existentes (ej: `adminEs`, `adminEn`, `adminPt`).
Agregar los imports, agregar al objeto `resources`, agregar `'tours'` a `ALL_NAMESPACES`.
No modificar nada más en ese archivo.

---

## REGLAS DE CALIDAD (del prompt_maestro.md aplicadas a este feature)

1. **TypeScript strict:** sin `any`. Usar `unknown` + type guard si es necesario.
2. **Sin hardcode de strings visibles:** todo texto vía `t()` con clave en namespace `tours`.
3. **Sin hardcode de colores hex en JSX:** solo en el objeto `styles` de Joyride config.
4. **Dark/light mode:** todos los componentes soportan ambos temas.
5. **Responsive:** tooltip adaptado a 320px, 768px, 1024px, 1440px (conceptualmente).
6. **Sin magic numbers:** usar constante `TOUR_AUTOSTART_DELAY_MS` para el delay.
7. **Componentes < 300 líneas:** dividir si crece.
8. **Alta cohesión, bajo acoplamiento:** el store no conoce los componentes; los componentes leen del store vía hooks.
9. **Sin efectos secundarios ocultos:** todas las acciones del store son predecibles y sincrónicas.
10. **Sin dependencias nuevas:** todo el stack ya está instalado.
11. **Sin código muerto, sin comentarios obvios.**
12. **El sistema no debe romper ninguna funcionalidad existente.**

---

## VALIDACIÓN FINAL

Antes de terminar, verificar:

- [ ] `npm run type-check --workspace=apps/web` sin errores nuevos
- [ ] Todos los archivos creados tienen imports válidos y resolubles
- [ ] Los layouts modificados siguen compilando
- [ ] El namespace `tours` está registrado en `i18n.ts` y es accesible con `useTranslation('tours')`
- [ ] `TourProvider` está añadido a los layouts de cada panel sin romper estructura existente
- [ ] `index.ts` exporta exactamente lo especificado (ni más ni menos)
- [ ] No hay strings hardcodeados en ningún componente
- [ ] `tour.store.ts` persiste solo `completedTours` (verificar la config de `partialize`)
- [ ] `useTour` tiene una referencia estable de `autoStartIfNeeded` (useCallback)
