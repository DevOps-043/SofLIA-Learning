'use client';

import { useCallback, useState } from 'react';
import { useSofLIAPersonalization } from './useSofLIAPersonalization';

export interface UseSofLIAVoiceToggleReturn {
  /** Estado persistido del modo de voz (`voice_enabled`, opt-out: default `true`). */
  isVoiceEnabled: boolean;
  /** `true` mientras la petición de persistencia está en vuelo. */
  isVoiceTogglePending: boolean;
  /** Activa/desactiva el modo de voz persistiendo `voice_enabled`. */
  toggleVoiceEnabled: () => Promise<void>;
}

/**
 * Toggle del modo de voz (TTS) de SofLIA persistido en la personalización del
 * usuario. `useSofLIAPersonalization` está respaldado por SWR con clave
 * compartida, así que TODOS los consumidores (este toggle, `useStreamingChatVoice`,
 * el panel lateral) ven el mismo `voice_enabled` al instante: al desactivar aquí,
 * el hook de locución corta el audio por su propio efecto interno.
 *
 * Mismo contrato que el toggle del header del panel lateral; vive en `core` para
 * que cualquier superficie de chat (cursos, panel embebido) lo reutilice sin
 * duplicar la lógica de persistencia.
 */
export function useSofLIAVoiceToggle(): UseSofLIAVoiceToggleReturn {
  const { settings, updateSettings } = useSofLIAPersonalization();
  const isVoiceEnabled = settings?.voice_enabled ?? true;
  const [isVoiceTogglePending, setIsVoiceTogglePending] = useState(false);

  const toggleVoiceEnabled = useCallback(async () => {
    if (isVoiceTogglePending) return;
    setIsVoiceTogglePending(true);
    try {
      await updateSettings({ voice_enabled: !isVoiceEnabled });
    } catch {
      // La personalización conserva el valor previo si la petición falla; el
      // botón simplemente queda en su estado anterior (sin romper la UI).
    } finally {
      setIsVoiceTogglePending(false);
    }
  }, [isVoiceEnabled, isVoiceTogglePending, updateSettings]);

  return { isVoiceEnabled, isVoiceTogglePending, toggleVoiceEnabled };
}
