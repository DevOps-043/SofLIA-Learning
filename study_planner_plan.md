# Refactoring StudyPlannerLIA.tsx — Plan de Continuación

## Estado Actual (26 Feb 2026)

**Archivo principal:** [apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx)
**Líneas actuales:** ~9,758 (original: ~11,362)

### ✅ Fases Completadas

#### Fase 1: Hook [useCalendarConnection](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/hooks/useCalendarConnection.ts#264-497) (conversación anterior)
- Extraída lógica de calendario a un hook independiente

#### Fase 2A: Hook [useVoiceEngine](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/hooks/useVoiceEngine.ts#208-544)
- Extraída lógica de TTS/STT (ElevenLabs + Web Speech API) a [useVoiceEngine.ts](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/hooks/useVoiceEngine.ts)
- Se corrigió [toggleAudio](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx#9395-9398) y [speak](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx#1494-1612) con parámetro `forceEnable`

#### Fase 3A: Constantes y Utilidades
- [PlannerIcons.tsx](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/components/icons/PlannerIcons.tsx) — [GoogleIcon](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/components/icons/PlannerIcons.tsx#3-23), [MicrosoftIcon](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/components/icons/PlannerIcons.tsx#24-32)
- [study-planner.constants.ts](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/constants/study-planner.constants.ts) — [StudyPlannerStep](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/constants/study-planner.constants.ts#1-7), `STUDY_PLANNER_STEPS`
- [calendar-error.util.ts](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/utils/calendar-error.util.ts) — [getCalendarErrorMessage()](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/utils/calendar-error.util.ts#1-43)

#### Fase 3B: Componentes UI (✅ COMPLETA — 25 Feb 2026)

| Componente | Archivo | Reducción |
|---|---|---|
| [CalendarConnectionModal](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/components/study-planner-modals/CalendarConnectionModal.tsx#17-167) | [CalendarConnectionModal.tsx](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/components/study-planner-modals/CalendarConnectionModal.tsx) | -169 líneas |
| [StudyApproachModal](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/components/study-planner-modals/StudyApproachModal.tsx#15-179) | [StudyApproachModal.tsx](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/components/study-planner-modals/StudyApproachModal.tsx) | -161 líneas |
| [EstimatedDateModal](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/components/study-planner-modals/EstimatedDateModal.tsx#16-222) | [EstimatedDateModal.tsx](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/components/study-planner-modals/EstimatedDateModal.tsx) | -228 líneas |
| [ChatInputArea](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/components/study-planner-ui/ChatInputArea.tsx#19-123) | [ChatInputArea.tsx](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/components/study-planner-ui/ChatInputArea.tsx) | -93 líneas |

**Bugs corregidos post-script (25 Feb 2026):**
- Faltaban 2 `</div>` entre el cierre de `showCalendarModal` y `<StudyApproachModal>` (cerraban `max-w-4xl` y `flex-1 overflow-y-auto`)
- `userType` prop de `CalendarConnectionModal` recibía `'b2b' | null | undefined` en vez de `string | undefined` → se añadió `?? undefined`
- Script temporal `_replace_modals.js` eliminado

---

#### Fase 3C: WelcomeTourOverlay (✅ COMPLETA — 25 Feb 2026)
- [WelcomeTourOverlay.tsx](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/components/study-planner-ui/WelcomeTourOverlay.tsx) — ~530 líneas extraídas del return principal
- 18 props: `isVisible`, `isMobile`, `isSpeaking`, `isAudioEnabled`, `isListening`, `isProcessing`, `currentStep`, `showResumePrompt`, `savedSessionDate`, + 9 handlers
- `StudyPlannerLIA.tsx` reducido a **~10,142 líneas**

#### Fase 3D: CourseSelectorModal (✅ COMPLETA — 25 Feb 2026)
- [CourseSelectorModal.tsx](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/components/study-planner-modals/CourseSelectorModal.tsx) — ~242 líneas extraídas
- Filtrando cursos se movió al componente (eliminó IIFE `(() => {...})()`)
- `StudyPlannerLIA.tsx` reducido a **~9,911 líneas**

#### Fase 3E: StudyPlannerHeader (✅ COMPLETA — 26 Feb 2026)
- [StudyPlannerHeader.tsx](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/components/study-planner-ui/StudyPlannerHeader.tsx) — ~175 líneas extraídas
- 12 props: `connectedCalendar`, `isProcessing`, `showCalendarModal`, `isMobile`, `hoveredButton`, `isAudioEnabled`, + 6 handlers
- Navegación `router.push` wrapeada en `onBack` callback en el padre
- `StudyPlannerLIA.tsx` reducido a **~9,758 líneas**

---

### 🔮 Fases Futuras

#### Fase 2B (Pospuesta): Extraer `useLIAConversation`
- [handleSendMessage](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/old_studyplanner.tsx#8216-9729), [handleVoiceQuestion](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/old_studyplanner.tsx#1762-1951), [generateWelcomeMessage](file:///c:/Users/Lordg/Desktop/Pulse%20Hub/SofLIA%20-%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/components/StudyPlannerLIA.tsx#962-1172) dependen de ~20+ states del planificador.
- Requiere diseñar un objeto de configuración que agrupe las dependencias.

---

## Estructura de Archivos Actual

```
apps/web/src/features/study-planner/
├── components/
│   ├── StudyPlannerLIA.tsx          (9,758 líneas — archivo principal)
│   ├── icons/
│   │   └── PlannerIcons.tsx         (GoogleIcon, MicrosoftIcon)
│   ├── study-planner-modals/
│   │   ├── CalendarConnectionModal.tsx
│   │   ├── CourseSelectorModal.tsx
│   │   ├── StudyApproachModal.tsx
│   │   └── EstimatedDateModal.tsx
│   └── study-planner-ui/
│       ├── ChatInputArea.tsx
│       ├── StudyPlannerHeader.tsx
│       └── WelcomeTourOverlay.tsx
├── constants/
│   └── study-planner.constants.ts   (STUDY_PLANNER_STEPS)
├── hooks/
│   ├── useVoiceEngine.ts            (TTS/STT engine)
│   ├── useCalendarConnection.ts     (Calendar OAuth)
│   └── useLIAData.ts               (Data fetching)
├── utils/
│   └── calendar-error.util.ts       (Error messages)
└── prompts/
    └── study-planner.prompt.ts
```
