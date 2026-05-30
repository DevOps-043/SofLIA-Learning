// Direcciones de voz para Gemini TTS (separadas de la mecánica de síntesis para
// que QA/contenido puedan auditarlas y ajustarlas con facilidad).
//
// La dirección de voz va en la primera línea y el contenido a leer va a
// continuación SIN modificar.
//
// No inyectamos tags entre corchetes ([warm], [curious], [sighs]…): el modelo a
// veces los verbaliza o produce prosodia/respiraciones artificiales, lo que QA
// reportó como "voz poco natural". Mantener el texto intacto también hace el
// prompt DETERMINISTA por (texto, voz, modelo, contexto), condición necesaria
// para cachear el audio entre usuarios.
//
// Acento objetivo: español de México (acento mexicano neutro). Al cambiar estos
// textos hay que subir TTS_PROMPT_VERSION en `shared.ts` para invalidar el caché.

const READING_VOICE_DIRECTION =
  'Narra en español de México, con acento mexicano neutro: voz femenina cálida, ' +
  'natural y clara, ritmo pausado y entonación variada (ni monótona ni robótica, ' +
  'sin teatralidad ni prisa). Lee el siguiente texto tal cual:';

const READING_CONTINUATION_DIRECTION =
  'Continúa con la misma voz femenina en español de México, acento mexicano ' +
  'neutro, tono cálido y natural. Lee el siguiente texto tal cual:';

const SOFLIA_VOICE_DIRECTION =
  'Lee el siguiente texto como SofLIA, en español de México con acento mexicano ' +
  'neutro: voz cálida, profesional y natural, ritmo claro, cercana pero no ' +
  'infantil, segura sin exagerar. Evita sonar robótica, teatral o apresurada. ' +
  'Lee el texto tal cual:';

export function buildSofliaSpeechPrompt(text: string): string {
  return `${SOFLIA_VOICE_DIRECTION}\n\n${text}`;
}

export function buildReadingSpeechPrompt(text: string): string {
  return `${READING_VOICE_DIRECTION}\n\n${text}`;
}

export function buildContinuationSpeechPrompt(text: string): string {
  return `${READING_CONTINUATION_DIRECTION}\n\n${text}`;
}
