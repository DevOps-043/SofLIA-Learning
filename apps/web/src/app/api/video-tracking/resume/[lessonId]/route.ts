import { createAdminClient } from '@/lib/supabase/admin';
import { logger as techDebtLogger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/features/auth/services/session.service';
import { resolveVideoLessonEnrollmentScope } from '@/features/video-tracking/services/video-tracking-scope.server';
import { buildSafeResumeCheckpoint } from '../../../lesson-tracking/update-progress/progress-security';

/**
 * GET /api/video-tracking/resume/[lessonId]
 * 
 * Obtiene el punto de reanudación del video para un usuario y lección específicos.
 * Retorna la posición donde el usuario dejó el video, la velocidad de reproducción,
 * y el porcentaje de completitud.
 * 
 * @param lessonId - ID de la lección (desde params)
 * @returns VideoResumeData con checkpoint, playbackRate, hasWatched, completionPercentage
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ lessonId: string }> }
) {
    try {
        // Use SessionService to get user (matches app's custom auth system)
        const user = await SessionService.getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use admin client after SessionService auth to avoid RLS/session drift.
        const supabase = createAdminClient();

        // Next.js 15: `params` es asíncrono y debe await-earse antes de usarlo.
        const { lessonId } = await params;

        if (!lessonId) {
            return NextResponse.json({ error: 'lessonId is required' }, { status: 400 });
        }

        const organizationId =
            request.nextUrl.searchParams.get('orgId') ??
            request.nextUrl.searchParams.get('organizationId');
        const enrollmentId = request.nextUrl.searchParams.get('enrollmentId');
        const enrollment = await resolveVideoLessonEnrollmentScope({
            enrollmentId,
            lessonId,
            organizationId,
            supabase,
            userId: user.id,
        });

        if (!enrollment) {
            return NextResponse.json(
                { error: 'Course enrollment scope not found' },
                { status: organizationId || enrollmentId ? 403 : 404 },
            );
        }

        // Buscar el tracking más reciente para esta lección y usuario
        const { data: tracking, error } = await supabase
            .from('lesson_tracking')
            .select('video_checkpoint_seconds, video_playback_rate, status, video_total_duration_seconds, video_max_seconds')
            .eq('user_id', user.id)
            .eq('enrollment_id', enrollment.enrollment_id)
            .eq('lesson_id', lessonId)
            .order('last_activity_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            techDebtLogger.error('[Resume API] Error fetching tracking:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        const { data: lessonProgress } = await supabase
            .from('user_lesson_progress')
            .select('current_time_seconds, video_progress_percentage, lesson_status, is_completed')
            .eq('user_id', user.id)
            .eq('enrollment_id', enrollment.enrollment_id)
            .eq('lesson_id', lessonId)
            .order('updated_at', { ascending: false, nullsFirst: false })
            .limit(1)
            .maybeSingle();

        // Si no hay tracking previo, retornar valores por defecto
        if (!tracking) {
            if (lessonProgress) {
                const completionPercentage = lessonProgress.video_progress_percentage || 0;
                const checkpointSeconds = buildSafeResumeCheckpoint({
                    checkpoint: lessonProgress.current_time_seconds || 0,
                    completionPercentage,
                    isCompleted: Boolean(lessonProgress.is_completed),
                    maxReached: lessonProgress.current_time_seconds || 0,
                });

                return NextResponse.json({
                    checkpointSeconds,
                    playbackRate: 1.0,
                    hasWatched: completionPercentage > 0,
                    completionPercentage,
                    maxReachedSeconds: lessonProgress.current_time_seconds || 0,
                    status: lessonProgress.is_completed
                        ? 'completed'
                        : lessonProgress.lesson_status || 'not_started'
                });
            }

            return NextResponse.json({
                checkpointSeconds: 0,
                playbackRate: 1.0,
                hasWatched: false,
                completionPercentage: 0,
                status: 'not_started'
            });
        }

        // Calcular porcentaje de completitud
        const completionPercentage = tracking.video_total_duration_seconds > 0
            ? Math.round((tracking.video_max_seconds / tracking.video_total_duration_seconds) * 100)
            : 0;
        const savedLessonProgressPercentage = lessonProgress?.video_progress_percentage || 0;
        const effectiveCompletionPercentage = Math.max(completionPercentage, savedLessonProgressPercentage);
        const checkpointSeconds = buildSafeResumeCheckpoint({
            checkpoint: tracking.video_checkpoint_seconds || lessonProgress?.current_time_seconds || 0,
            completionPercentage: effectiveCompletionPercentage,
            isCompleted: Boolean(lessonProgress?.is_completed),
            maxReached: tracking.video_max_seconds || 0,
        });

        return NextResponse.json({
            checkpointSeconds,
            playbackRate: tracking.video_playback_rate || 1.0,
            hasWatched: tracking.video_max_seconds > 0 || savedLessonProgressPercentage > 0,
            completionPercentage: effectiveCompletionPercentage,
            maxReachedSeconds: tracking.video_max_seconds || 0,
            status: lessonProgress?.is_completed ? 'completed' : tracking.status
        });
    } catch (error) {
        techDebtLogger.error('[Resume API] Unexpected error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? String(error) : undefined
        }, { status: 500 });
    }
}
