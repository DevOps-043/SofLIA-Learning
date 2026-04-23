import type { NextRequest } from 'next/server';
import type { CommentBodyValidation } from './types';

interface RawCommentBody {
  content?: unknown;
  parent_comment_id?: unknown;
}

export async function validateCommentRequestBody(
  request: NextRequest
): Promise<CommentBodyValidation> {
  const body = (await request.json()) as RawCommentBody;
  const content = typeof body.content === 'string' ? body.content : '';
  const trimmedContent = content.trim();

  if (trimmedContent.length === 0) {
    return {
      ok: false,
      error: 'El contenido del comentario es requerido',
      status: 400,
    };
  }

  if (trimmedContent.length > 1000) {
    return { ok: false, error: 'El comentario es demasiado largo', status: 400 };
  }

  return {
    ok: true,
    body: {
      content: trimmedContent,
      parentCommentId: getParentCommentId(body.parent_comment_id),
    },
  };
}

function getParentCommentId(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : null;
}
