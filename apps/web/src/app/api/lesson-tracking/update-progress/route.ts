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
import { normalizeVideoProgress } from './progress-security';

/**
 * Tiempo real (segundos) transcurrido entre el último reporte registrado y ahora.
 *
 * Es la base anti-cheat del avance permitido: el "máximo alcanzado" solo puede
 * crecer en proporción al tiempo que realmente ha pasado. Devuelve `undefined`
 * cuando no hay marca previa o es inválida, para que el normalizador caiga en su
 * comportamiento por defecto (solo colchón fijo).
 */
function elapsedSecondsSince(
    lastActivityAt: string | null | undefined,
    nowIso: string,
): number | undefined {
    if (!lastActivityAt) {
        return undefined;
    }

    const previousMs = new Date(lastActivityAt).getTime();
    const nowMs = new Date(nowIso).getTime();

    if (!Number.isFinite(previousMs) || !Number.isFinite(nowMs)) {
        return undefined;
    }

    return Math.max(0, (nowMs - previousMs) / 1000);
}

async function syncUserLessonProgress({
    checkpoint,
    lessonId,
    now,
    supabase,
    totalDuration,
    userId,
    videoProgressPercentage,
}: {
    checkpoint: number;
    lessonId: string;
    now: string;
    supabase: ReturnType<typeof createAdminClient>;
    totalDuration: number;
    userId: string;
    videoProgressPercentage: number;
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

        const { lessonId, trackingId, checkpoint, maxReached, totalDuration, playbackRate, reachedEnd } = body;

        const now = new Date().toISOString();
        const { data: existingProgress } = await supabase
            .from('user_lesson_progress')
            .select('current_time_seconds, video_progress_percentage')
            .eq('user_id', user.id)
            .eq('lesson_id', lessonId)
            .order('updated_at', { ascending: false, nullsFirst: false })
            .limit(1)
            .maybeSingle();

        const fallbackMaxFromProgress = totalDuration > 0
            ? Math.round(((existingProgress?.video_progress_percentage || 0) / 100) * totalDuration)
            : existingProgress?.current_time_seconds || 0;

        // Si hay trackingId, intentar actualizar ese registro específico
        if (trackingId) {
            const { data: trackingRow, error: trackingLookupError } = await supabase
                .from('lesson_tracking')
                .select('id, video_max_seconds, last_activity_at')
                .eq('id', trackingId)
                .eq('user_id', user.id)
                .maybeSingle();

            if (trackingLookupError) {
                techDebtLogger.error('[Update Progress] Error loading tracking:', trackingLookupError);
                return apiError('TRACKING_LOOKUP_FAILED', 'Failed to load tracking', 500);
            }

            if (!trackingRow) {
                return apiError('TRACKING_NOT_FOUND', 'Tracking not found', 404);
            }

            const normalizedProgress = normalizeVideoProgress({
                checkpoint,
                currentMaxReached: Math.max(trackingRow.video_max_seconds || 0, fallbackMaxFromProgress),
                incomingMaxReached: maxReached,
                totalDuration,
                elapsedSeconds: elapsedSecondsSince(trackingRow.last_activity_at, now),
                playbackRate,
                reachedEnd,
            });

            const { error } = await supabase
                .from('lesson_tracking')
                .update({
                    video_checkpoint_seconds: normalizedProgress.safeCheckpoint,
                    video_max_seconds: normalizedProgress.safeMaxReached,
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
                checkpoint: normalizedProgress.safeCheckpoint,
                lessonId,
                now,
                supabase,
                totalDuration,
                userId: user.id,
                videoProgressPercentage: normalizedProgress.videoProgressPercentage,
            });

            return NextResponse.json({ success: true, trackingId });
        }

        // Si no hay trackingId, buscar o crear tracking
        const { data: existingTracking } = await supabase
            .from('lesson_tracking')
            .select('id, video_max_seconds, last_activity_at')
            .eq('user_id', user.id)
            .eq('lesson_id', lessonId)
            .eq('status', 'in_progress')
            .order('last_activity_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existingTracking) {
            // Actualizar tracking existente
            // Calcular nuevo máximo (nunca decrece)
            const normalizedProgress = normalizeVideoProgress({
                checkpoint,
                currentMaxReached: Math.max(existingTracking.video_max_seconds || 0, fallbackMaxFromProgress),
                incomingMaxReached: maxReached,
                totalDuration,
                elapsedSeconds: elapsedSecondsSince(existingTracking.last_activity_at, now),
                playbackRate,
                reachedEnd,
            });

            const { error } = await supabase
                .from('lesson_tracking')
                .update({
                    video_checkpoint_seconds: normalizedProgress.safeCheckpoint,
                    video_max_seconds: normalizedProgress.safeMaxReached,
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
                checkpoint: normalizedProgress.safeCheckpoint,
                lessonId,
                now,
                supabase,
                totalDuration,
                userId: user.id,
                videoProgressPercentage: normalizedProgress.videoProgressPercentage,
            });

            return NextResponse.json({ success: true, trackingId: existingTracking.id });
        }

        // Tracking nuevo: no hay actividad previa, así que el avance permitido se
        // limita al colchón fijo (sin componente de tiempo transcurrido).
        const normalizedProgress = normalizeVideoProgress({
            checkpoint,
            currentMaxReached: fallbackMaxFromProgress,
            incomingMaxReached: maxReached,
            totalDuration,
            playbackRate,
            reachedEnd,
        });

        // Crear nuevo tracking si no existe
        const { data: newTracking, error: insertError } = await supabase
            .from('lesson_tracking')
            .insert({
                user_id: user.id,
                lesson_id: lessonId,
                status: 'in_progress',
                started_at: now,
                video_started_at: now,
                video_checkpoint_seconds: normalizedProgress.safeCheckpoint,
                video_max_seconds: normalizedProgress.safeMaxReached,
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
            checkpoint: normalizedProgress.safeCheckpoint,
            lessonId,
            now,
            supabase,
            totalDuration,
            userId: user.id,
            videoProgressPercentage: normalizedProgress.videoProgressPercentage,
        });

        return NextResponse.json({ success: true, trackingId: newTracking.id });
    } catch (error) {
        techDebtLogger.error('[Update Progress] Unexpected error:', error);
        return apiError('TRACKING_INTERNAL_ERROR', 'Internal server error', 500);
    }
}

export const POST = withZodBody(updateLessonProgressSchema, handlePost);
