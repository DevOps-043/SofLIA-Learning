import { handleCreateHierarchyChatMessageRequest } from './chat-messages'

interface RouteParams {
  params: Promise<{ chatId: string }>
}

export async function POST(request: Request, { params }: RouteParams) {
  return handleCreateHierarchyChatMessageRequest(request, params)
}
