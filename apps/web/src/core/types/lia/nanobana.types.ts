import type {
  NanoBananaDomain,
  NanoBananaSchema,
  OutputFormat,
} from '../../../lib/nanobana/templates'

export interface GeneratedNanoBananaData {
  schema: NanoBananaSchema
  jsonString: string
  domain: NanoBananaDomain
  outputFormat: OutputFormat
}
