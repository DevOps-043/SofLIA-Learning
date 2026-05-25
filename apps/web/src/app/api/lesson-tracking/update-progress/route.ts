import { createAdminClient } from '@/lib/supabase/admin';
import { logger as techDebtLogger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/features/auth/services/session.service';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import {
    updateLessonProgressSchema,
    type UpdateLessonProgressBody,
} from './schema';

async function syncUserLessonProgress({
    checkpoint,
    lessonId,
    maxReached,
    now,
    supabase,
    totalDuration,
    userId,
}: {
    checkpoint: number;
    lessonId: string;
    maxReached: number;
    now: string;
    supabase: ReturnType<typeof createAdminClient>;
    totalDuration: number;
    userId: string;
}) {
    const { data: progressRow, error: progressLookupError } = await supabase
        .from('user_lesson_progress')
        .select('progress_id, lesson_status, is_completed')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

    if (progressLookupError) {
        techDebtLogger.warn('[Update Progress] Unable to sync user_lesson_progress lookup:', progressLookupError);
        return;
    }

    const videoProgressPercentage = totalDuration > 0
        ? Math.min(100, Math.round((Math.max(checkpoint, maxReached) / totalDuration) * 100))
        : 0;

    if (!progressRow) {
        return;
    }

    const updatePayload: {
        current_time_seconds: number;
        last_accessed_at: string;
        lesson_status?: string;
        updated_at: string;
        video_progress_percentage: number;
    } = {
        current_time_seconds: checkpoint,
        last_accessed_at: now,
        updated_at: now,
        video_progress_percentage: videoProgressPercentage,
    };

    if (!progressRow.is_completed && (!progressRow.lesson_status || progressRow.lesson_status === 'not_started')) {
        updatePayload.lesson_status = 'in_progress';
    }

    const { error: progressUpdateError } = await supabase
        .from('user_lesson_progress')
        .update(updatePayload)
        .eq('progress_id', progressRow.progress_id);

    if (progressUpdateError) {
        techDebtLogger.warn('[Update Progress] Unable to sync user_lesson_progress:', progressUpdateError);
    }
}

/**
 * POST /api/lesson-tracking/update-progress
 * 
 * Actualiza el progreso del video en la tabla lesson_tracking.
 * Maneja tanto actualizaciones de tracking existente como creación de nuevo tracking.
 * 
 * Request body:
 * {
 *   lessonId: string;
 *   trackingId?: string;
 *   checkpoint: number;
 *   maxReached: number;
 *   totalDuration: number;
 *   playbackRate: number;
 * }
 * 
 * @returns { success: boolean, trackingId?: string, error?: string }
 */
async function handlePost(
    _request: NextRequest,
    body: UpdateLessonProgressBody,
) {
    try {
        // Use SessionService to get user (matches app's custom auth system)
        const user = await SessionService.getCurrentUser();

        if (!user) {
            return apiError('UNAUTHORIZED', 'Unauthorized', 401);
        }

        // Use admin client after SessionService auth to avoid RLS/session drift.
        const supabase = createAdminClient();

        const { lessonId, trackingId, checkpoint, maxReached, totalDuration, playbackRate } = body;

        const now = new Date().toISOString();

        // Si hay trackingId, intentar actualizar ese registro específico
        if (trackingId) {
            const { error } = await supabase
                .from('lesson_tracking')
                .update({
                    video_checkpoint_seconds: checkpoint,
                    video_max_seconds: maxReached,
                    video_total_duration_seconds: totalDuration,
                    video_playback_rate: playbackRate || 1.0,
                    last_activity_at: now,
                    updated_at: now
                })
                .eq('id', trackingId)
                .eq('user_id', user.id); // Seguridad: solo actualizar si es del usuario

            if (error) {
                techDebtLogger.error('[Update Progress] Error updating tracking:', error);
                return apiError('TRACKING_UPDATE_FAILED', 'Failed to update tracking', 500);
            }

            await syncUserLessonProgress({
                checkpoint,
                lessonId,
                maxReached,
                now,
                supabase,
                totalDuration,
                userId: user.id,
            });

            return NextResponse.json({ success: true, trackingId });
        }

        // Si no hay trackingId, buscar o crear tracking
        const { data: existingTracking } = await supabase
            .from('lesson_tracking')
            .select('id, video_max_seconds')
            .eq('user_id', user.id)
            .eq('lesson_id', lessonId)
            .eq('status', 'in_progress')
            .order('last_activity_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existingTracking) {
            // Actualizar tracking existente
            // Calcular nuevo máximo (nunca decrece)
            const newMax = Math.max(existingTracking.video_max_seconds || 0, maxReached);

            const { error } = await supabase
                .from('lesson_tracking')
                .update({
                    video_checkpoint_seconds: checkpoint,
                    video_max_seconds: newMax,
                    video_total_duration_seconds: totalDuration,
                    video_playback_rate: playbackRate || 1.0,
                    last_activity_at: now,
                    updated_at: now
                })
                .eq('id', existingTracking.id);

            if (error) {
                techDebtLogger.error('[Update Progress] Error updating existing tracking:', error);
                return apiError(
                    'EXISTING_TRACKING_UPDATE_FAILED',
                    'Failed to update existing tracking',
                    500,
                );
            }

            await syncUserLessonProgress({
                checkpoint,
                lessonId,
                maxReached: newMax,
                now,
                supabase,
                totalDuration,
                userId: user.id,
            });

            return NextResponse.json({ success: true, trackingId: existingTracking.id });
        }

        // Crear nuevo tracking si no existe
        const { data: newTracking, error: insertError } = await supabase
            .from('lesson_tracking')
            .insert({
                user_id: user.id,
                lesson_id: lessonId,
                status: 'in_progress',
                started_at: now,
                video_started_at: now,
                video_checkpoint_seconds: checkpoint,
                video_max_seconds: maxReached,
                video_total_duration_seconds: totalDuration,
                video_playback_rate: playbackRate || 1.0,
                last_activity_at: now
            })
            .select('id')
            .single();

        if (insertError) {
            techDebtLogger.error('[Update Progress] Error creating tracking:', insertError);
            return apiError('TRACKING_CREATE_FAILED', 'Failed to create tracking', 500);
        }

        await syncUserLessonProgress({
            checkpoint,
            lessonId,
            maxReached,
            now,
            supabase,
            totalDuration,
            userId: user.id,
        });

        return NextResponse.json({ success: true, trackingId: newTracking.id });
    } catch (error) {
        techDebtLogger.error('[Update Progress] Unexpected error:', error);
        return apiError('TRACKING_INTERNAL_ERROR', 'Internal server error', 500);
    }
}

export const POST = withZodBody(updateLessonProgressSchema, handlePost);
