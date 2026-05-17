import { NextRequest, NextResponse } from 'next/server';
import { handleGetComments } from './comments.get';
import { handlePostComment } from './comments.post';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> },
) {
  try {
    return await handleGetComments(request, params);
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; postId: string }> },
) {
  try {
    return await handlePostComment(request, params);
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
