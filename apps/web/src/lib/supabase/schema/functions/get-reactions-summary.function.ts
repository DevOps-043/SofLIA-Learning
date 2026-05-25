import type { Json } from '../json'

export type GetReactionsSummaryFunction = {
  Args: { p_post_id: string }
  Returns: {
    count: number
    reaction_type: string
    users: Json
  }[]
}
