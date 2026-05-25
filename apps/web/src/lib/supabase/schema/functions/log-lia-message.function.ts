export type LogLiaMessageFunction = {
  Args: {
    p_content: string
    p_conversation_id: string
    p_cost_usd?: number
    p_is_system_message?: boolean
    p_model_used?: string
    p_response_time_ms?: number
    p_role: string
    p_tokens_used?: number
  }
  Returns: string
}
