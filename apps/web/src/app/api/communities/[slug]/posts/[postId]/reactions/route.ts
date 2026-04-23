import type { NextRequest } from 'next/server';
import {
  handleGetPostReactionsRequest,
  handlePostReactionRequest,
  type PostReactionRouteContext,
} from './post-reactions';

export async function GET(
  request: NextRequest,
  context: PostReactionRouteContext
) {
  return handleGetPostReactionsRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: PostReactionRouteContext
) {
  return handlePostReactionRequest(request, context);
}
