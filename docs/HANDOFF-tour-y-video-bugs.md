# Handoff — Bugs pendientes: Tour del curso + Video del learning path

> Documento de traspaso para una sesión nueva enfocada solo en estos 2 bugs.
> Generado tras una sesión larga que ya cerró ~12 bugs previos.

---

## Bug 1 — El tour del panel del curso falla

### Síntoma
En `/courses/[slug]/learn`, el tour Joyride muestra el paso 1 ("Bienvenido al panel del curso", 1/6, centrado) pero:
- No resalta (spotlight) ningún elemento.
- Al pulsar "Siguiente" el tour **desaparece por completo** en lugar de avanzar al paso 2.

### Diagnóstico ya realizado
Los **6 IDs de destino del tour existen en el código** (verificado):

| Paso | Selector | Componente que lo renderiza |
|---|---|---|
| 1 welcome | `#course-learn-workspace` | `app/courses/[slug]/learn/course-learn-shell/CourseLearnWorkspace.tsx` |
| 2 sidebar | `#course-learn-sidebar` | `features/courses/components/learn/sidebar/CourseSidebarPanel.tsx` (solo cuando `isOpen`) |
| 3 videoPanel | `#course-learn-video-panel` | `features/courses/components/learn/video-content/VideoPanel.tsx` |
| 4 tools | `#course-learn-tools` | `app/courses/[slug]/learn/course-learn-shell/LessonTabsBar.tsx` |
| 5 soflia | `#lia-tour-trigger-stable` | `features/courses/components/CourseLia/components/CourseLiaFloatingButton.tsx` |
| 6 ready | `#course-learn-replay-button` | `features/courses/components/learn/LearnPageHeader.tsx` |

### Mecanismo del fallo (causa probable)
En `features/tours/hooks/useCourseLearnJoyride.ts`, función `handleJoyrideCallback` (~línea 327):

```ts
if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
  const nextStepIndex = action === ACTIONS.PREV ? index - 1 : index + 1;
  ...
  if (nextStepIndex >= tourSteps.length) { await finishTour(); return; }
  setStepIndex(nextStepIndex);
}
```

`STEP_AFTER` y `TARGET_NOT_FOUND` se tratan **idénticamente**: ambos avanzan. Si al pulsar "Siguiente" el paso 2 no encuentra su target a tiempo → `TARGET_NOT_FOUND` → avanza al 3 → tampoco listo → `TARGET_NOT_FOUND` → ... **cascada por los 6 pasos en un solo clic** → `nextStepIndex >= 6` → `finishTour()` → el tour desaparece.

### Por dónde empezar la investigación
1. **Leer el wrapper custom de Joyride.** Los steps usan `before`, `beforeTimeout`, `targetWaitTimeout` (props que NO son de `react-joyride` estándar). Hay un wrapper `<SofliaJoyride>` o equivalente que consume `joyrideProps`. Buscar dónde se renderiza el Joyride en la página learn (`CourseLearnPageShell.tsx` / `course-learn-shell/`), y leer ese wrapper + `features/tours/types/joyride.ts`.
2. Confirmar si el wrapper **realmente invoca el hook `before`** de cada step (que abre el panel izquierdo con `openLeftPanel()` y espera el target con `waitForStepTargetReady`).
3. Verificar en runtime (DevTools) si `#course-learn-sidebar` existe y es visible cuando el tour intenta el paso 2.

### Fix probable
- `TARGET_NOT_FOUND` NO debe tratarse igual que `STEP_AFTER`. En vez de avanzar (y cascadear), debe **reintentar/esperar** el target, o pausar el tour, no saltar al siguiente paso.
- Revisar que el hook `before` se ejecute y resuelva antes de que Joyride evalúe el target.

### Archivos clave
- `features/tours/hooks/useCourseLearnJoyride.ts` — orquestación del tour
- `features/tours/config/course-learn-joyride-steps.tsx` — definición de los 6 pasos
- `features/tours/types/joyride.ts` — tipos custom (`SofliaJoyrideStep`, `SofliaJoyrideEvent`)
- `features/tours/components/JoyrideTooltip.tsx` — tooltip custom
- El wrapper `<Joyride>` / `<SofliaJoyride>` — **por localizar** (grep `react-joyride` import del componente, no del hook)
- `core/constants/tourTargets.ts` — IDs y selectores
- `features/tours/hooks/useTourProgress.ts` — persistencia de progreso del tour

### Contexto importante
- En esta sesión se **eliminó el bloque de "Ruta de Aprendizaje"** del `CourseSidebarPanel` (a petición del usuario). El `#course-learn-sidebar` (la motion.div con el id) **NO se tocó** — sigue existiendo. Pero conviene confirmar que el panel sigue abriéndose bien.

---

## Bug 2 — Los videos del learning path no aparecen

### Síntoma
En el panel del curso (`/courses/[slug]/learn`), el video muestra "cargando" y luego **desaparece** — no se puede iniciar, no aparece el reproductor.

### Estado / contexto
- En sesiones previas se migró el reproductor de `video.js` a `hls.js` y se tocó `useVideoTracking` (anti-inundación de fetch).
- El `course-theme` se simplificó (ya no inyecta CSS `!important`).
- NO se ha investigado este bug todavía.

### Por dónde empezar
1. `features/courses/components/learn/video-content/VideoPanel.tsx` — el panel del video.
2. `features/courses/hooks/useCourseIntroVideos.ts` — máquina de estados de intro videos.
3. `core/components/CustomVideoPlayer/CustomVideoPlayer.tsx` + `lib/media/useVideoJsHlsPlayback.ts` — reproductor + HLS.
4. `app/courses/[slug]/learn/CourseLearnPageShell.tsx` — monta el player, bloquea el tour mientras el video se muestra.
5. Revisar en DevTools: ¿la URL del video carga (Network)? ¿hay error de HLS? ¿el `<video>` recibe `src`?
6. Verificar si el bug es del intro-video overlay (`IntroVideoOverlay.tsx`) tapando/ocultando el video real.

### Hipótesis a verificar
- El intro-video overlay (`IntroVideoOverlay`) podría quedarse en estado "cargando" y luego desmontarse dejando el panel vacío.
- La fuente HLS (`.m3u8`) podría no resolverse, o el `useVideoJsHlsPlayback` no adjunta el player.
- El estado de `useCourseIntroVideos` podría no transicionar bien.

---

## Notas generales del proyecto
- Stack: Next.js 15.5, React 18, TypeScript, Supabase, TailwindCSS.
- Tema: clases `.light` / `.dark` en `<html>`; la escala `--color-gray-*` está **invertida en `.light`** (gray-900 = claro). Cuidado al tocar colores.
- `npm run dev` levanta web (:3000) + api (:4000).
