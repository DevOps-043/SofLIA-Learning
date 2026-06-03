// Voice directions for Gemini TTS. Keep these deterministic: prompt version,
// provider, voice, model, context, and text are part of the shared audio cache.

const READING_VOICE_DIRECTION =
  'Narra en espanol de Mexico, con acento mexicano neutro: voz femenina calida, ' +
  'natural y clara, ritmo pausado y entonacion variada, sin teatralidad ni prisa. ' +
  'Usa las etiquetas de expresion como instrucciones de audio y no las leas en voz alta. ' +
  'Lee el siguiente texto tal cual:';

const READING_CONTINUATION_DIRECTION =
  'Continua con la misma voz femenina en espanol de Mexico, acento mexicano neutro, ' +
  'tono calido y natural. Usa las etiquetas de expresion como instrucciones de audio ' +
  'y no las leas en voz alta. Lee el siguiente texto tal cual:';

const SOFLIA_VOICE_DIRECTION =
  'Lee el siguiente texto como SofLIA, en espanol de Mexico con acento mexicano neutro: ' +
  'voz calida, profesional y natural, ritmo claro, cercana pero no infantil, segura sin ' +
  'exagerar. Evita sonar robotica, teatral o apresurada. Lee el texto tal cual:';

export function buildSofliaSpeechPrompt(text: string): string {
  return `${SOFLIA_VOICE_DIRECTION}\n\n${text}`;
}

export function inferReadingExpressionTags(text: string): string[] {
  const normalized = text.trim();
  const tags = ['warm', 'clear'];

  if (/[?\u00bf]/u.test(normalized)) {
    tags.push('curious');
  }

  if (/[!\u00a1]/u.test(normalized)) {
    tags.push('amazed');
  }

  if (/^(resumen|conclusi[o\u00f3]n|importante|nota|advertencia)[:\s]/iu.test(normalized)) {
    tags.push('serious');
  }

  if (/^\d+[.)]\s+/u.test(normalized) || /^[-*\u2022]\s+/u.test(normalized)) {
    tags.push('focused');
  }

  if (normalized.length > 0 && normalized.length < 90 && !/[.!?]$/u.test(normalized)) {
    tags.push('introductory');
  }

  return Array.from(new Set(tags));
}

function withExpressionTags(text: string): string {
  return `${inferReadingExpressionTags(text).map((tag) => `[${tag}]`).join(' ')}\n${text}`;
}

export function buildReadingSpeechPrompt(text: string): string {
  return `${READING_VOICE_DIRECTION}\n\n${withExpressionTags(text)}`;
}

export function buildContinuationSpeechPrompt(text: string): string {
  return `${READING_CONTINUATION_DIRECTION}\n\n${withExpressionTags(text)}`;
}
