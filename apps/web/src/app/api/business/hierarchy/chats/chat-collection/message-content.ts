import { HierarchyChatsError } from './errors'

export async function readMessageBody(request: Request) {
  const body = (await request.json()) as Record<string, unknown>
  const content = body.content

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new HierarchyChatsError(400, {
      success: false,
      error: 'El contenido del mensaje es requerido',
    })
  }

  return { body, content: content.trim() }
}
