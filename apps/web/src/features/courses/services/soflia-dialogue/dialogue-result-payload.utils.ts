function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

export function readPersistedDialogueScore(responsePayload: unknown) {
  const payload = readRecord(responsePayload)
  const dialogueResult = readRecord(payload?.dialogueResult)
  const score = dialogueResult?.score

  return typeof score === 'number' && Number.isFinite(score) ? score : null
}
