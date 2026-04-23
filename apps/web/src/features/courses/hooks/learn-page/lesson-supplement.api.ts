type LessonSupplementKey = 'transcript_content' | 'summary_content'

type LessonSupplementResponse = Partial<
  Record<LessonSupplementKey, string | null | undefined>
>

export async function loadLessonSupplement({
  url,
  contentKey,
  signal,
}: {
  url: string
  contentKey: LessonSupplementKey
  signal: AbortSignal
}): Promise<string | null> {
  const response = await fetch(url, {
    credentials: 'include',
    signal,
  })

  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as LessonSupplementResponse
  const content = data[contentKey]

  return typeof content === 'string' && content.trim().length > 0
    ? content
    : null
}
