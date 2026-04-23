export function buildQuestionResponseCounts(
  responses: Array<{ question_id: string }> | null,
) {
  const countsMap = new Map<string, number>()
  ;(responses || []).forEach((response) => {
    countsMap.set(
      response.question_id,
      (countsMap.get(response.question_id) || 0) + 1,
    )
  })
  return countsMap
}

export function buildUserQuestionReactions(
  reactions: Array<{ question_id: string | null; reaction_type: string }> | null,
) {
  const reactionsMap = new Map<string, string>()
  ;(reactions || []).forEach((reaction) => {
    if (!reaction.question_id) return
    reactionsMap.set(reaction.question_id, reaction.reaction_type)
  })
  return reactionsMap
}
