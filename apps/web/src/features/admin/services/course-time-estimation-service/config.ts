export const AI_BATCH_SIZE = 20
export const GLOBAL_MIN_MINUTES = 1
export const GLOBAL_MAX_MINUTES = 480

// `getGeminiApiKey` se eliminó al soportar varios proveedores: comprobar la clave
// de Google daría un falso negativo si el propósito está configurado con OpenAI.
// La disponibilidad se consulta ahora con `isAiPurposeAvailable`.
