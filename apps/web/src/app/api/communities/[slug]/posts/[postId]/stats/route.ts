import type { NextRequest } from 'next/server';
import {
  handleGetPostReactionStatsRequest,
  handleRefreshPostReactionStatsRequest,
  type PostReactionStatsRouteContext,
} from './post-reaction-stats';

export async function GET(
  request: NextRequest,
  context: PostReactionStatsRouteContext
) {
  return handleGetPostReactionStatsRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: PostReactionStatsRouteContext
) {
  return handleRefreshPostReactionStatsRequest(request, context);
}
