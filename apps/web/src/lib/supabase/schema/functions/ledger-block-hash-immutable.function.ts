import type { Json } from '../json'

export type LedgerBlockHashImmutableFunction = {
  Args: {
    p_cert_id: string
    p_created_at: string
    p_op: string
    p_payload: Json
    p_prev_hash: string
  }
  Returns: string
}
