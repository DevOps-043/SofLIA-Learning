export type ValidateCertificateFunction = {
  Args: { p_hash: string }
  Returns: {
    certificate_id: string
    chain_ok: boolean
    course_title: string
    is_expired: boolean
    is_valid: boolean
    issued_at: string
    last_block_at: string
    last_op: string
    user_id: string
  }[]
}
