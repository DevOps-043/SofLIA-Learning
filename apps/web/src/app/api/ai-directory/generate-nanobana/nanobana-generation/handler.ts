import { SessionService } from '@/features/auth/services/session.service'
import { logger } from '@/lib/utils/logger'
import { resolveNanoBananaPreferences } from './domain-detection'
import { buildNanoBananaResponsePayload } from './friendly-response'
import { startNanoBananaConversation, logNanoBananaConversationMessages } from './lia-analytics'
import { buildNanoBananaMessages } from './message-builder'
import { requestNanoBananaSchema } from './openai-request'
import { parseAndNormalizeNanoBananaSchema, createBaseTemplate } from './schema-normalizer'
import type { ApiRouteResult, GenerateNanoBananaBody } from './types'
import { trackNanoBananaUsage } from './usage-tracking'

export async function handleGenerateNanoBananaRequest(body: GenerateNanoBananaBody): Promise<ApiRouteResult> {
  logger.log('API generate-nanobana called')

  if (!body.message || typeof body.message !== 'string') {
    return { status: 400, body: { error: 'Mensaje requerido' } }
  }

  const user = await SessionService.getCurrentUser()
  const tracking = await startNanoBananaConversation(user?.id || null)
  const { domain, outputFormat } = resolveNanoBananaPreferences(body)
  const baseTemplate = createBaseTemplate(domain)
  const messages = buildNanoBananaMessages({ body, domain, outputFormat, baseTemplate })
  const completion = await requestNanoBananaSchema(messages)

  await trackNanoBananaUsage(completion)

  const generatedSchema = parseAndNormalizeNanoBananaSchema({
    responseText: completion.responseText,
    baseTemplate,
    domain,
    outputFormat,
  })
  const responsePayload = buildNanoBananaResponsePayload({
    conversationId: tracking.conversationId,
    domain,
    outputFormat,
    generatedSchema,
  })

  await logNanoBananaConversationMessages({
    tracking,
    userMessage: body.message,
    assistantMessage: responsePayload.response,
    completion,
  })

  return { status: 200, body: responsePayload }
}
