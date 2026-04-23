import { handleCreateHierarchyChatRequest, handleListHierarchyChatsRequest } from './chat-collection'

export async function GET(request: Request) {
  return handleListHierarchyChatsRequest(request)
}

export async function POST(request: Request) {
  return handleCreateHierarchyChatRequest(request)
}
