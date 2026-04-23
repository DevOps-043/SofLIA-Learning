import type { NextRequest } from 'next/server';
import {
  handleCreateCommentRequest,
  handleGetCommentsRequest,
  type CommentRouteContext,
} from './comment-thread';

export async function GET(
  request: NextRequest,
  context: CommentRouteContext
) {
  return handleGetCommentsRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: CommentRouteContext
) {
  return handleCreateCommentRequest(request, context);
}
