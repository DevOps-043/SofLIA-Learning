export const CREATE_PROMPT_PATTERNS = [
  /\b(crear|generar|hacer|ayuda.*crear|ayúdame.*crear)\b.*\bprompt\b/i,
  /\bprompt\b.*(para|sobre|de)\b/i,
  /\bcómo\b.*(crear|hacer|generar)\b.*\bprompt\b/i,
  /\bnecesito\b.*\bprompt\b/i,
  /\bquiero\b.*\bprompt\b/i,
  /\bprompt\b.*(que|para|de)\b/i,
  /\b(chatgpt|claude|gpt|ia)\b.*\b(instrucciones|instrucción|prompt)\b/i,
  /\b(system prompt|user prompt|assistant prompt)\b/i,
  /\bprompt engineering\b/i,
  /\bplantilla.*ia\b/i,
  /\bprompts?\b.*\b(efectivos?|buenos?|mejores?)\b/i,
]

export const PROMPT_KEYWORDS = [
  'prompt',
  'prompts',
  'plantilla',
  'instrucciones',
  'chatgpt',
  'claude',
  'ia',
  'inteligencia artificial',
  'system prompt',
  'user prompt',
  'prompt engineering',
]
