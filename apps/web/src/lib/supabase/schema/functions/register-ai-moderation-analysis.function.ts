import type { Json } from '../json'

export type RegisterAiModerationAnalysisFunction = {
  Args: {
    p_api_response: Json
    p_categories: Json
    p_confidence_score: number
    p_content_id: string
    p_content_text: string
    p_content_type: string
    p_is_flagged: boolean
    p_model_used: string
    p_processing_time_ms: number
    p_reasoning: string
    p_user_id: string
  }
  Returns: string
}
