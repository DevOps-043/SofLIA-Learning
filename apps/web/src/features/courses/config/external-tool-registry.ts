import type { ExternalToolKey } from '../types/activity-config'

export interface ExternalToolDefinition {
  key: ExternalToolKey
  label: string
  url: string | null
  description: string
}

export const externalToolRegistry: Record<
  ExternalToolKey,
  ExternalToolDefinition
> = {
  chatgpt: {
    key: 'chatgpt',
    label: 'ChatGPT',
    url: 'https://chatgpt.com/',
    description: 'Asistente conversacional general.',
  },
  gemini: {
    key: 'gemini',
    label: 'Gemini',
    url: 'https://gemini.google.com/',
    description: 'Asistente multimodal de Google.',
  },
  notebooklm: {
    key: 'notebooklm',
    label: 'NotebookLM',
    url: 'https://notebooklm.google.com/',
    description: 'Cuaderno de investigacion asistido por IA.',
  },
  gamma: {
    key: 'gamma',
    label: 'Gamma',
    url: 'https://gamma.app/',
    description: 'Creacion asistida de presentaciones y documentos.',
  },
  atlas: {
    key: 'atlas',
    label: 'Atlas',
    url: 'https://chatgpt.com/atlas',
    description: 'Experiencia de investigacion y verificacion basada en Atlas.',
  },
}

export function getExternalToolDefinition(
  toolKey?: ExternalToolKey | null,
): ExternalToolDefinition | null {
  if (!toolKey) {
    return null
  }

  return externalToolRegistry[toolKey] ?? null
}
