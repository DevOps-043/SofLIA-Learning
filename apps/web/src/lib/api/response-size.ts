export const RESPONSE_SIZE_HEADER = 'X-Response-Size-Bytes'

const STREAMING_CONTENT_TYPES = [
  'application/octet-stream',
  'application/pdf',
  'text/event-stream',
]

export function parseResponseContentLength(value: string | null): number | null {
  if (!value) return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return null
  return Math.floor(parsed)
}

export function isStreamingResponse(response: Response): boolean {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
  return STREAMING_CONTENT_TYPES.some((type) => contentType.includes(type))
}

export async function measureResponseSizeBytes(
  response: Response,
): Promise<number | null> {
  const declaredSize = parseResponseContentLength(
    response.headers.get('content-length'),
  )
  if (declaredSize !== null) return declaredSize
  if (!response.body || isStreamingResponse(response)) return null

  try {
    const cloned = response.clone()
    const body = await cloned.arrayBuffer()
    return body.byteLength
  } catch {
    return null
  }
}
