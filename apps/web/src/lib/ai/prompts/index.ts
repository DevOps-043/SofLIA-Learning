/**
 * Variantes de prompt por proveedor.
 *
 * Cada prompt de la plataforma tiene DOS TEXTOS ESCRITOS A MANO: el original de
 * Gemini (congelado, calibrado con uso real) y una copia adaptada a OpenAI. El
 * gateway resuelve el proveedor y entrega el perfil del modelo al constructor de
 * prompt, que elige la variante:
 *
 *   await generateAiText({
 *     purpose: 'lia_general',
 *     systemInstruction: (profile) => buildMiPrompt(profile, datos),
 *     prompt: mensajeDelUsuario,
 *     circuitBreakerName: '...',
 *   })
 *
 * Y dentro de `buildMiPrompt`:
 *
 *   selectPromptVariant(profile, { google: buildGoogleVariant, openai: buildOpenAiVariant }, datos)
 *
 * Módulo puro e isomorfo: no arrastra SDKs ni código de servidor.
 */
export { buildPromptModelProfile, selectPromptVariant } from './prompt-variants'

export type { PromptModelProfile, PromptVariants } from './types'
