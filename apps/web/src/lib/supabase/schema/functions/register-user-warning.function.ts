import type { Json } from '../json'

export type RegisterUserWarningFunction = {
  Args: {
    p_blocked_content?: string
    p_content_id?: string
    p_content_type: string
    p_reason: string
    p_user_id: string
  }
  Returns: Json
}
