async function readJsonResponse(response: Response, fallbackMessage: string) {
  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    const text = await response.text().catch(() => '')
    throw new Error(text.includes('<!DOCTYPE') ? fallbackMessage : text || fallbackMessage)
  }

  return response.json()
}

type BusinessLearningPathApiData = Record<string, unknown> & {
  success?: boolean
  error?: string
}

async function requestBusinessLearningPathResource(
  url: string,
  fallbackMessage: string,
  init?: RequestInit,
): Promise<BusinessLearningPathApiData> {
  const response = await fetch(url, { credentials: 'include', ...init })
  const data = (await readJsonResponse(response, fallbackMessage)) as BusinessLearningPathApiData

  if (!response.ok || !data.success) {
    throw new Error(data.error || fallbackMessage)
  }

  return data
}

export async function getBusinessLearningPathResource<T>(
  url: string,
  fallbackMessage: string,
  mapData: (data: BusinessLearningPathApiData) => T,
): Promise<T> {
  const data = await requestBusinessLearningPathResource(url, fallbackMessage)
  return mapData(data)
}

export function postBusinessLearningPathResource(
  url: string,
  payload: unknown,
  fallbackMessage: string,
) {
  return requestBusinessLearningPathResource(url, fallbackMessage, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function deleteBusinessLearningPathResource(
  url: string,
  fallbackMessage: string,
) {
  return requestBusinessLearningPathResource(url, fallbackMessage, {
    method: 'DELETE',
  })
}
