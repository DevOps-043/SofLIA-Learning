/**
 * Colores del botón de dictado por voz (micrófono) de SofLIA.
 *
 * El micrófono se pintaba en gris neutro y pasaba desapercibido. Ahora usa el
 * color de la organización (branding personalizado) y, cuando la organización no
 * define uno, el acento de la plataforma (`--color-accent`).
 *
 * `--org-accent-color` solo existe dentro del layout de organización, por eso el
 * fallback encadenado: sirve igual en las superficies que quedan fuera.
 */
export const VOICE_INPUT_ACCENT_FALLBACK = 'var(--org-accent-color, var(--color-accent))'

export interface VoiceInputColors {
  /** Color del icono del micrófono. */
  icon: string
  /** Fondo del botón: tinte suave del acento para que resalte sin gritar. */
  background: string
  /** Borde del botón, algo más marcado que el fondo. */
  border: string
}

/**
 * Deriva los colores del botón de micrófono a partir del acento efectivo.
 *
 * @param accentColor acento de la organización ya resuelto por el llamador
 *                    (`effectiveStyles.accent_color`, `themeColors.accentColor`, ...).
 *                    Si viene vacío se cae al acento de la plataforma.
 */
export function buildVoiceInputColors(accentColor?: string | null): VoiceInputColors {
  const accent = accentColor?.trim() || VOICE_INPUT_ACCENT_FALLBACK

  return {
    icon: accent,
    background: `color-mix(in srgb, ${accent} 16%, transparent)`,
    border: `color-mix(in srgb, ${accent} 40%, transparent)`,
  }
}
