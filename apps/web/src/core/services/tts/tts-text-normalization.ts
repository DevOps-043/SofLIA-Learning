/**
 * Pronunciation normalization for TTS reading audio.
 *
 * TTS engines mangle acronyms and abbreviations: "IA" comes out as a stretched
 * "iaaa", "RRHH" as garbage. This module rewrites known abbreviations to their
 * correct spoken form BEFORE synthesis, so the narration sounds natural.
 *
 * Rules are ordered [pattern, replacement] pairs. Patterns are case-sensitive and
 * anchored on word boundaries so they only hit standalone uppercase acronyms — not
 * substrings of real words (e.g. "IA" never matches inside "media" or "industria").
 *
 * To add an abbreviation, append a rule to SPANISH_SPEECH_REPLACEMENTS. Keep the
 * replacement in lowercase words; the TTS handles capitalization/prosody itself.
 */

interface SpeechReplacement {
  readonly pattern: RegExp;
  readonly replacement: string;
}

// Spanish abbreviations. Order matters: more specific/multi-token forms first.
const SPANISH_SPEECH_REPLACEMENTS: readonly SpeechReplacement[] = [
  // Recursos Humanos — "RRHH", "RR.HH.", "RR. HH."
  { pattern: /\bRR\.?\s?HH\.?/g, replacement: 'recursos humanos' },
  // Tecnologías de la Información (y Comunicación)
  { pattern: /\bTIC\b/g, replacement: 'tecnologías de la información' },
  // Inteligencia Artificial — by far the most common offender in this content
  { pattern: /\bIA\b/g, replacement: 'inteligencia artificial' },
  // Machine Learning / aprendizaje automático
  { pattern: /\bML\b/g, replacement: 'aprendizaje automático' },
  // Business metrics frequently embedded in training material
  { pattern: /\bKPIs\b/g, replacement: 'indicadores clave de desempeño' },
  { pattern: /\bKPI\b/g, replacement: 'indicador clave de desempeño' },
  { pattern: /\bROI\b/g, replacement: 'retorno de inversión' },
  { pattern: /\bB2B\b/g, replacement: 'business to business' },
  { pattern: /\bB2C\b/g, replacement: 'business to consumer' },
];

/**
 * Rewrites known abbreviations in `text` to their spoken form. Pure and idempotent
 * for the supported set. Currently Spanish-only; `language` is accepted so EN/PT
 * rule sets can be added without changing call sites.
 */
export function normalizeTextForSpeech(text: string, language: string = 'es'): string {
  if (!text) return text;
  if (language !== 'es') return text;

  let out = text;
  for (const { pattern, replacement } of SPANISH_SPEECH_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
