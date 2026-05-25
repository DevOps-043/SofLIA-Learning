import { NextRequest, NextResponse } from 'next/server';
import { pollVoteSchema, type PollVoteBody } from '@/app/api/communities/_schemas';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { createClient } from '../../../../../../../lib/supabase/server';
import { SessionService } from '../../../../../../../features/auth/services/session.service';

interface PollAttachmentData {
  options: string[];
  votes?: Record<string, string[]>;
  userVotes?: Record<string, string>;
  [key: string]: unknown;
}

interface CommunityPollPostRow {
  id: string;
  attachment_type: string | null;
  attachment_data: PollAttachmentData | null;
}

interface CommunityPollAttachmentRow {
  attachment_data: PollAttachmentData | null;
}

type RouteContext = { params: Promise<{ slug: string; postId: string }> };

function isPollAttachmentData(value: unknown): value is PollAttachmentData {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as PollAttachmentData;
  return Array.isArray(candidate.options);
}

async function handlePost(
  _request: NextRequest,
  body: PollVoteBody,
  { params }: RouteContext,
) {
  try {
    const { postId } = await params;
    const supabase = await createClient();

    const user = await SessionService.getCurrentUser();
    if (!user) {
      return apiError('UNAUTHORIZED', 'No autorizado', 401);
    }

    const { option, action } = body;

    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('id, attachment_type, attachment_data')
      .eq('id', postId)
      .single<CommunityPollPostRow>();

    if (postError || !post) {
      return apiError('POST_NOT_FOUND', 'Post no encontrado', 404);
    }

    if (post.attachment_type !== 'poll') {
      return apiError('POST_IS_NOT_POLL', 'Este post no es una encuesta', 400);
    }

    const pollData = post.attachment_data;
    if (!isPollAttachmentData(pollData)) {
      return apiError('INVALID_POLL_DATA', 'Datos de encuesta inválidos', 400);
    }

    if (!pollData.votes || typeof pollData.votes !== 'object') {
      const initialVotes: Record<string, string[]> = {};
      pollData.options.forEach((pollOption: string) => {
        initialVotes[pollOption] = [];
      });
      pollData.votes = initialVotes;
      pollData.userVotes = pollData.userVotes || {};
    }

    if (!pollData.options.includes(option)) {
      return apiError('INVALID_POLL_OPTION', 'Opción no válida', 400);
    }

    const currentUserVote = pollData.userVotes?.[user.id] || null;
    const updatedPollData = { ...pollData };
    const updatedVotes = { ...pollData.votes };
    const updatedUserVotes = { ...(pollData.userVotes || {}) };

    if (action === 'vote') {
      if (currentUserVote === option) {
        return NextResponse.json({
          success: true,
          message: 'Ya votaste por esta opción',
          pollData: updatedPollData,
        });
      }

      if (currentUserVote && updatedVotes[currentUserVote]) {
        const currentVotes = Array.isArray(updatedVotes[currentUserVote])
          ? updatedVotes[currentUserVote]
          : [];
        updatedVotes[currentUserVote] = currentVotes.filter(
          (voterId: string) => voterId !== user.id,
        );
      }

      const currentOptionVotes = Array.isArray(updatedVotes[option])
        ? updatedVotes[option]
        : [];

      if (!currentOptionVotes.includes(user.id)) {
        updatedVotes[option] = [...currentOptionVotes, user.id];
      }

      updatedUserVotes[user.id] = option;
    } else {
      if (currentUserVote !== option) {
        return NextResponse.json({
          success: true,
          message: 'No has votado por esta opción',
          pollData: updatedPollData,
        });
      }

      if (updatedVotes[option]) {
        const currentVotes = Array.isArray(updatedVotes[option])
          ? updatedVotes[option]
          : [];

        updatedVotes[option] = currentVotes.filter(
          (voterId: string) => voterId !== user.id,
        );
      }

      delete updatedUserVotes[user.id];
    }

    updatedPollData.votes = updatedVotes;
    updatedPollData.userVotes = updatedUserVotes;

    const { error: updatePostError } = await supabase
      .from('community_posts')
      .update({
        attachment_data: updatedPollData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId);

    if (updatePostError) {
      return apiError('UPDATE_POLL_FAILED', 'Error actualizando encuesta', 500);
    }

    return NextResponse.json({
      success: true,
      message: action === 'vote' ? 'Voto registrado' : 'Voto eliminado',
      pollData: updatedPollData,
      userVote: action === 'vote' ? option : null,
    });
  } catch {
    return apiError('POLL_VOTE_FAILED', 'Error interno del servidor', 500);
  }
}

export const POST = withZodBody(pollVoteSchema, handlePost);

// GET para obtener el voto actual del usuario
export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { postId } = await params;
    const supabase = await createClient();

    const user = await SessionService.getCurrentUser();
    if (!user) {
      return apiError('UNAUTHORIZED', 'No autorizado', 401);
    }

    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('attachment_data')
      .eq('id', postId)
      .single<CommunityPollAttachmentRow>();

    if (postError || !post) {
      return apiError('POST_NOT_FOUND', 'Post no encontrado', 404);
    }

    const pollData = post.attachment_data;

    if (isPollAttachmentData(pollData) && (!pollData.votes || typeof pollData.votes !== 'object')) {
      const initialVotes: Record<string, string[]> = {};
      pollData.options.forEach((option: string) => {
        initialVotes[option] = [];
      });
      pollData.votes = initialVotes;
      pollData.userVotes = pollData.userVotes || {};
    }

    const userVote = pollData?.userVotes?.[user.id] || null;

    return NextResponse.json({
      success: true,
      userVote,
      pollData,
    });
  } catch {
    return apiError('GET_POLL_VOTE_FAILED', 'Error interno del servidor', 500);
  }
}
