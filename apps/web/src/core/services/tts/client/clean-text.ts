// Limpia markdown/ruido de un texto para que la voz lea contenido natural.
// Compartido por la voz del chat (one-shot y streaming).
export function cleanTextForSpeech(text: string): string {
  if (!text) return text;
  let cleaned = text;
  cleaned = cleaned.replace(/```[\w]*\n?[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
  cleaned = cleaned.replace(/([^*\n])\*([^*\n]+)\*([^*\n])/g, '$1$2$3');
  cleaned = cleaned.replace(/([^_\n])_([^_\n]+)_([^_\n])/g, '$1$2$3');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  cleaned = cleaned.replace(/^>\s+/gm, '');
  cleaned = cleaned.replace(/^[-*]{3,}$/gm, '');
  // Viñetas de lista al inicio de línea ("- ", "* ", "+ ").
  cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, '');
  // Marcadores de formato SOBRANTES (negritas/itálicas/código cuyo par quedó
  // partido entre fragmentos del streaming). Sin esto la voz pronuncia
  // "asterisco", "guion bajo", etc. Solo alimenta la síntesis: el texto visible
  // del chat no se ve afectado.
  cleaned = cleaned.replace(/[*_`]/g, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  return cleaned.trim();
}
