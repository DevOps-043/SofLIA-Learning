export type RejectCommunityCreationRequestFunction = {
  Args: {
    rejection_reason: string
    request_id: string
    reviewer_id: string
  }
  Returns: undefined
}
