import type { Json } from '../json'

export type GetEntityTranslationsFunction = {
  Args: {
    p_entity_id: string
    p_entity_type: string
    p_language_code: string
  }
  Returns: Json
}
