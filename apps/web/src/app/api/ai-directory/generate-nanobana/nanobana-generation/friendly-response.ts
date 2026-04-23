import type { NanoBananaDomain, NanoBananaSchema, OutputFormat } from './types'

const DOMAIN_NAMES: Record<NanoBananaDomain, string> = {
  ui: 'Interfaz de Usuario',
  photo: 'Fotografia/Marketing',
  diagram: 'Diagrama',
}

const FORMAT_NAMES: Record<OutputFormat, string> = {
  wireframe: 'Wireframe',
  mockup: 'Mockup',
  render: 'Render',
  diagram: 'Diagrama',
}

export function buildNanoBananaResponsePayload(params: {
  conversationId: string | null
  domain: NanoBananaDomain
  outputFormat: OutputFormat
  generatedSchema: NanoBananaSchema
}) {
  const { conversationId, domain, outputFormat, generatedSchema } = params
  const entityCount = generatedSchema.entities?.length || 0
  const response = `JSON generado exitosamente.\n\nDominio: ${DOMAIN_NAMES[domain]}\nFormato: ${FORMAT_NAMES[outputFormat]}\nEntidades: ${entityCount} elementos\n\nEl esquema esta listo para usar en NanoBanana Pro.`

  return {
    response,
    generatedSchema,
    domain,
    outputFormat,
    jsonString: JSON.stringify(generatedSchema, null, 2),
    conversationId,
  }
}
