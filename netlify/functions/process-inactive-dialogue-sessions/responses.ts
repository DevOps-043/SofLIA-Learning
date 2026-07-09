export function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    body: JSON.stringify(body),
  }
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}
