import { OpenAI } from 'openai'
import type { OpenAI as OpenAIType } from 'openai'
import type { NanoBananaCompletionResult } from './types'

export const NANO_BANANA_MODEL = 'gpt-4o'

export async function requestNanoBananaSchema(
  messages: OpenAIType.Chat.Completions.ChatCompletionMessageParam[],
): Promise<NanoBananaCompletionResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')

  const openai = new OpenAI({ apiKey })
  const startTime = Date.now()
  const completion = await openai.chat.completions.create({
    model: NANO_BANANA_MODEL,
    messages,
    temperature: 0.5,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  })

  const responseText = completion.choices[0]?.message?.content
  if (!responseText) {
    throw new Error('No se recibio respuesta de OpenAI')
  }

  return {
    model: NANO_BANANA_MODEL,
    responseText,
    responseTime: Date.now() - startTime,
    usage: completion.usage || null,
  }
}
