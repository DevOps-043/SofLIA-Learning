export type DetectSuspiciousTokenActivityFunction = {
  Args: never
  Returns: {
    active_tokens_count: number
    different_devices_count: number
    different_ips_count: number
    user_id: string
  }[]
}
