import type { OpenAI } from 'openai'
import { EDUCATIONAL_PROMOTIONAL_INSTRUCTIONS, NANOBANA_MASTER_PROMPT } from './master-prompt'
import type {
  GenerateNanoBananaBody,
  NanoBananaDomain,
  NanoBananaSchema,
  OutputFormat,
} from './types'

export function buildNanoBananaMessages(params: {
  body: GenerateNanoBananaBody
  domain: NanoBananaDomain
  outputFormat: OutputFormat
  baseTemplate: NanoBananaSchema
}): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const { body, domain, outputFormat, baseTemplate } = params
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: NANOBANA_MASTER_PROMPT },
    { role: 'system', content: buildTemplateContextPrompt(domain, outputFormat, baseTemplate) },
  ]

  getRecentHistory(body.conversationHistory).forEach((message) => {
    messages.push({ role: message.sender === 'ai' ? 'assistant' : 'user', content: message.text })
  })

  messages.push({ role: 'user', content: buildNanoBananaUserPrompt(body.message || '', domain, outputFormat) })
  return messages
}

function buildTemplateContextPrompt(domain: NanoBananaDomain, outputFormat: OutputFormat, baseTemplate: NanoBananaSchema) {
  return `CONTEXTO ACTUAL:\n- Dominio detectado: ${domain}\n- Formato de salida: ${outputFormat}\n- Plantilla base a usar: ${JSON.stringify(baseTemplate, null, 2)}\n\nGenera un JSON completo basado en la solicitud del usuario usando esta plantilla como punto de partida.`
}

function buildNanoBananaUserPrompt(message: string, domain: NanoBananaDomain, outputFormat: OutputFormat) {
  const promptParts = [
    `Genera un JSON estructurado para NanoBanana Pro basado en esta descripcion:\n\n${message}`,
    `Dominio: ${domain}\nFormato: ${outputFormat}`,
  ]

  if (shouldAddEducationalInstructions(domain, message)) {
    promptParts.push(EDUCATIONAL_PROMOTIONAL_INSTRUCTIONS)
  }

  promptParts.push('Responde solo con el JSON valido, sin explicaciones adicionales.')
  return promptParts.join('\n\n')
}

function getRecentHistory(history: GenerateNanoBananaBody['conversationHistory']) {
  return Array.isArray(history) ? history.slice(-6) : []
}

function shouldAddEducationalInstructions(domain: NanoBananaDomain, message: string) {
  const normalizedMessage = message.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const keywords = ['curso', 'educativo', 'promocional', 'banner', 'portada']
  return domain === 'photo' && keywords.some((keyword) => normalizedMessage.includes(keyword))
}
