import { handleGetHierarchyChatRequest } from './chat-detail'

interface RouteParams {
  params: Promise<{ chatId: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
  return handleGetHierarchyChatRequest(request, params)
}
