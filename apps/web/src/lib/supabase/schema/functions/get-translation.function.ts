export type GetTranslationFunction = {
  Args: {
    p_entity_id: string
    p_entity_type: string
    p_fallback_value: string
    p_field_name: string
    p_language_code: string
  }
  Returns: string
}
