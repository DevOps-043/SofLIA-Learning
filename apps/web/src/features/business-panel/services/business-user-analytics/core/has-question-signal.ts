import { LiaMessageRecord } from './lia-message-record'

export function hasQuestionSignal(message: LiaMessageRecord): boolean {
  if (message.contains_question) return true
  const content = message.content.trim()
  if (!content) return false
  if (content.includes('?') || content.includes('\u00bf')) return true
  const normalizedContent = content
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  return /\b(que|como|cual|cuando|donde|por que|porque|puedes|podrias|ayuda|explica|explicame|what|how|why|when|where|which|can you|could you)\b/.test(normalizedContent)
}
