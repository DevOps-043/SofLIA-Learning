# Sistema de Tours de Voz Contextuales

Sistema modular de agentes de voz para guiar usuarios en diferentes secciones de la plataforma.

## Arquitectura

### Componente Base: `ContextualVoiceGuide`

Componente reutilizable que proporciona:

- ✅ Tours interactivos con voz (ElevenLabs + fallback nativo)
- ✅ Conversación bidireccional (reconocimiento de voz)
- ✅ Navegación paso a paso
- ✅ Reproducible múltiples veces
- ✅ Almacenamiento de progreso en localStorage
- ✅ Responsive design
- ✅ Control de audio independiente

### Props

```typescript
interface ContextualVoiceGuideProps {
  tourId: string; // ID único (ej: 'prompt-directory')
  steps: VoiceGuideStep[]; // Pasos del tour
  triggerPaths: string[]; // Rutas donde aparece automáticamente
  isReplayable?: boolean; // Si se puede repetir (default: true)
  showDelay?: number; // Delay antes de mostrar (default: 1000ms)
  replayButtonLabel?: string; // Texto del botón de replay
  requireAuth?: boolean; // Si requiere autenticación
}
```

## Tours Implementados

### 1. Tour Principal - Dashboard (OnboardingAgent)

- **Ubicación**: `/dashboard` (solo primera vez)
- **Storage Key**: `has-seen-onboarding`
- **Características**:
  - Introducción general a la plataforma
  - Presentación de LIA
  - Navegación a secciones principales
  - Botón de replay exclusivo del dashboard

### 2. Tour Prompt Directory

- **Ubicación**: `/prompt-directory`
- **Storage Key**: `has-seen-tour-prompt-directory`
- **Características**:
  - Exploración de prompts destacados
  - Sistema de búsqueda y filtros
  - Favoritos
  - Creación de prompts
  - Botón de replay visible en la página

## Cómo Crear Nuevos Tours

### Paso 1: Crear configuración del tour

```typescript
// src/features/[feature]/config/[feature]-tour.ts
import { VoiceGuideStep } from "../../../core/components/ContextualVoiceGuide";

export const MI_TOUR_STEPS: VoiceGuideStep[] = [
  {
    id: 1,
    title: "Título del paso",
    description: "Descripción visual del paso",
    speech: "Texto que se lee en voz alta",
    action: {
      // Opcional
      label: "Ir a X",
      path: "/ruta",
    },
  },
  // ... más pasos
];
```

### Paso 2: Integrar en la página

```tsx
import {
  ContextualVoiceGuide,
  ReplayTourButton,
} from "@/core/components/ContextualVoiceGuide";
import { MI_TOUR_STEPS } from "@/features/mi-feature/config/mi-tour";

export default function MiPagina() {
  return (
    <>
      {/* Tu contenido */}

      {/* Tour contextual */}
      <ContextualVoiceGuide
        tourId="mi-feature"
        steps={MI_TOUR_STEPS}
        triggerPaths={["/mi-ruta"]}
        isReplayable={true}
        showDelay={1500}
        replayButtonLabel="Ver tour de [Feature]"
      />

      {/* Botón de replay */}
      <ReplayTourButton
        tourId="mi-feature"
        label="Ver tour de [Feature]"
        allowedPaths={["/mi-ruta"]}
      />
    </>
  );
}
```

## Buenas Prácticas

### Diseño de Pasos

1. **Claridad**: Cada paso debe tener un objetivo claro
2. **Brevedad**: Mantén las descripciones concisas (2-3 líneas)
3. **Naturalidad**: El texto de `speech` debe sonar conversacional
4. **Progresión**: Del más general al más específico
5. **Interactividad**: Incluye un paso de conversación (opcional)

### Ejemplo de Estructura Recomendada

```
Paso 1: Bienvenida - ¿Qué es esta sección?
Paso 2: Característica Principal A
Paso 3: Característica Principal B
Paso 4: Cómo usar la búsqueda/filtros
Paso 5: Acciones importantes (crear, guardar, etc.)
Paso 6: Conversación interactiva (opcional)
Paso 7: Cierre y próximos pasos
```

## Configuración de Voz

### ElevenLabs (Producción)

```env
ELEVENLABS_API_KEY=tu_api_key
ELEVENLABS_VOICE_ID=ay4iqk10DLwc8KGSrf2t
```

El frontend debe consumir la voz a travÃ©s del proxy server-side `/api/tts` para no exponer secretos en cliente.

**Optimizaciones aplicadas:**

- Modelo: `eleven_turbo_v2_5`
- Latencia: `optimize_streaming_latency: 4`
- Formato: `mp3_22050_32`
- Latencia reducida: ~500-1100ms

### Fallback Nativo

Si no hay API key, usa `window.speechSynthesis` del navegador.

## Separación de Responsabilidades

### Tour Principal (Dashboard)

- **Propósito**: Introducción general a la plataforma
- **Alcance**: Features principales, LIA, navegación
- **Frecuencia**: Una sola vez por usuario nuevo
- **Botón**: Solo visible en `/dashboard`

### Tours Contextuales (Features específicos)

- **Propósito**: Guía detallada de una sección específica
- **Alcance**: Features y funcionalidades de esa sección
- **Frecuencia**: Repetible cuando el usuario lo necesite
- **Botón**: Visible en la sección correspondiente

## Almacenamiento

Cada tour guarda su estado en localStorage:

```
has-seen-onboarding                    // Tour principal
has-seen-tour-prompt-directory         // Tour prompt directory
has-seen-tour-workshops                // Futuro: Tour workshops
```

## Ejemplos de Uso

### Tour para Workshops (Ejemplo futuro)

```typescript
// src/features/workshops/config/workshops-tour.ts
export const WORKSHOPS_TOUR_STEPS: VoiceGuideStep[] = [
  {
    id: 1,
    title: "¡Bienvenido a los Talleres!",
    description:
      "Los talleres son experiencias prácticas donde aplicarás lo aprendido.",
    speech:
      "Bienvenido a los talleres. Aquí aplicarás lo aprendido en experiencias prácticas guiadas.",
  },
  // ... más pasos
];
```

```tsx
// src/app/workshops/page.tsx
<ContextualVoiceGuide
  tourId="workshops"
  steps={WORKSHOPS_TOUR_STEPS}
  triggerPaths={['/workshops']}
  isReplayable={true}
/>

<ReplayTourButton
  tourId="workshops"
  label="Ver tour de talleres"
  allowedPaths={['/workshops']}
/>
```

## Ventajas del Sistema

✅ **Modular**: Cada tour es independiente
✅ **Escalable**: Fácil agregar nuevos tours
✅ **Mantenible**: Cambios en uno no afectan otros
✅ **Reutilizable**: Mismo código base para todos
✅ **Flexible**: Configuración por props
✅ **Optimizado**: Voz de baja latencia
✅ **UX Consistente**: Misma experiencia en todas las secciones

## Testing

Para probar un tour:

1. **Primera visita**: Borra el localStorage correspondiente

   ```javascript
   localStorage.removeItem("has-seen-tour-[tourId]");
   ```

2. **Botón de replay**: Usa el botón flotante en la página

3. **Desarrollo**: Agrega el botón dev (ya existe para dashboard)

## Roadmap

- [ ] Tour para Workshops
- [ ] Tour para Prompt Maker (página de creación)
- [ ] Tour para Learning Paths
- [ ] Analytics de completación de tours
- [ ] A/B testing de diferentes contenidos
- [ ] Soporte multiidioma
- [ ] Personalización por perfil de usuario

## Soporte

Si el tour no aparece, verifica:

1. ✅ `tourId` único y consistente
2. ✅ `triggerPaths` coincide con la ruta actual
3. ✅ localStorage no tiene la key del tour
4. ✅ `requireAuth` está configurado correctamente
5. ✅ API key de ElevenLabs (si se usa)
6. ✅ Permisos de micrófono (para conversación)
