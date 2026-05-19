import { NextRequest } from 'next/server';
import {
  createCommunityCommentSchema,
  type CreateCommunityCommentBody,
} from '@/app/api/communities/_schemas';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { handleGetComments } from './comments.get';
import { handlePostComment } from './comments.post';

type RouteContext = { params: Promise<{ slug: string; postId: string }> };

export async function GET(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    return await handleGetComments(request, params);
  } catch {
    return apiError('GET_COMMENTS_FAILED', 'Error interno del servidor', 500);
  }
}

async function handlePost(
  request: NextRequest,
  body: CreateCommunityCommentBody,
  { params }: RouteContext,
) {
  try {
    return await handlePostComment(request, body, params);
  } catch {
    return apiError('CREATE_COMMENT_FAILED', 'Error interno del servidor', 500);
  }
}

export const POST = withZodBody(createCommunityCommentSchema, handlePost);
