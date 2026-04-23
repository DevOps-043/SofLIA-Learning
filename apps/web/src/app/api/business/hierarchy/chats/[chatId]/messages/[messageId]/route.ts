import {
  handleDeleteHierarchyChatMessageRequest,
  handleUpdateHierarchyChatMessageRequest,
} from './message-actions'

interface RouteParams {
  params: Promise<{ chatId: string; messageId: string }>
}

export async function PUT(request: Request, { params }: RouteParams) {
  return handleUpdateHierarchyChatMessageRequest(request, params)
}

export async function DELETE(request: Request, { params }: RouteParams) {
  return handleDeleteHierarchyChatMessageRequest(params)
}
