import { cloneTemplate, getTemplate } from '@/lib/nanobana/templates'
import type { NanoBananaDomain, NanoBananaSchema, OutputFormat } from './types'

export function createBaseTemplate(domain: NanoBananaDomain) {
  return cloneTemplate(getTemplate(domain))
}

export function parseAndNormalizeNanoBananaSchema(params: {
  responseText: string
  baseTemplate: NanoBananaSchema
  domain: NanoBananaDomain
  outputFormat: OutputFormat
}): NanoBananaSchema {
  const { responseText, baseTemplate, domain, outputFormat } = params

  let generatedSchema: Partial<NanoBananaSchema>
  try {
    generatedSchema = JSON.parse(responseText) as Partial<NanoBananaSchema>
  } catch {
    throw new Error(
      `La IA devolvio una respuesta que no es JSON valido. Preview: "${responseText.slice(0, 120)}..."`,
    )
  }

  if (!generatedSchema.meta) {
    generatedSchema.meta = { ...baseTemplate.meta, createdAt: new Date().toISOString() }
  }
  if (!generatedSchema.scene) {
    generatedSchema.scene = baseTemplate.scene
  }
  if (!generatedSchema.entities) {
    generatedSchema.entities = []
  }
  if (!generatedSchema.constraints) {
    generatedSchema.constraints = baseTemplate.constraints || {}
  }

  generatedSchema.meta.domain = domain
  generatedSchema.meta.outputFormat = outputFormat
  generatedSchema.meta.createdAt = new Date().toISOString()
  return generatedSchema as NanoBananaSchema
}
