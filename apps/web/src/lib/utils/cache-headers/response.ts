export function withCacheHeaders<T extends Response>(
  response: T,
  headers: Record<string, string>,
): T {
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}
