import { calculateOpenAIMetadata, trackOpenAICall } from '@/lib/openai/usage-monitor'
import { extractNextSteps, extractSuggestions } from './response-parsers'
import { generateResources } from './resources'
import type { ProactiveHelpRequest } from './types'

const MODEL = 'gpt-4-turbo-preview'

interface OpenAIChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>
  usage?: unknown
}

interface OpenAIUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export async function generateOpenAIProactiveResponse(
  body: ProactiveHelpRequest,
  prompt: string,
) {
  const openaiApiKey = process.env.OPENAI_API_KEY
  if (!openaiApiKey) return null

  const startTime = Date.now()
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    }),
  })

  if (!response.ok) {
    console.error('Error llamando a OpenAI:', await response.text())
    throw new Error('OpenAI API error')
  }

  const data = (await response.json()) as OpenAIChatCompletionResponse
  await trackUsageIfPresent(data, body.userId, Date.now() - startTime)

  const liaResponse = data.choices?.[0]?.message?.content || 'Lo siento, no pude generar una respuesta.'
  return {
    response: liaResponse,
    suggestions: extractSuggestions(liaResponse),
    resources: generateResources(body.analysis.patterns),
    nextSteps: extractNextSteps(liaResponse),
  }
}

function buildSystemPrompt() {
  return `Eres LIA, una tutora virtual especializada en inteligencia artificial y aprendizaje personalizado.
Tu tarea es ofrecer ayuda proactiva cuando detectas que un usuario tiene dificultades.
Sé empática, específica y constructiva. Ofrece pasos concretos y ejemplos prácticos.`
}

async function trackUsageIfPresent(
  data: OpenAIChatCompletionResponse,
  userId: string | undefined,
  responseTime: number,
) {
  if (!isOpenAIUsage(data.usage)) return
  await trackOpenAICall(calculateOpenAIMetadata(data.usage, MODEL, 'lia-proactive-help', userId, responseTime))
}

function isOpenAIUsage(usage: unknown): usage is OpenAIUsage {
  if (!usage || typeof usage !== 'object') return false

  const candidate = usage as Partial<OpenAIUsage>
  return (
    typeof candidate.prompt_tokens === 'number' &&
    typeof candidate.completion_tokens === 'number' &&
    typeof candidate.total_tokens === 'number'
  )
}
