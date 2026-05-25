const QUESTION_WORDS = [
  '¿',
  'qué',
  'cuál',
  'cuáles',
  'cómo',
  'dónde',
  'cuándo',
  'quién',
  'quiénes',
  'por qué',
  'para qué',
  'puedes',
  'podrías',
  'me puedes',
  'me podrías',
]

export function isQuestion(messageLower: string): boolean {
  return QUESTION_WORDS.some((word) => messageLower.includes(word))
}
