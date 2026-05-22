import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/features/auth/services/session.service';

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

        // Create Supabase client for database operations
        const supabase = await createClient();

        // Next.js 15: `params` es asíncrono y debe await-earse antes de usarlo.
        const { lessonId } = await params;

        if (!lessonId) {
            return NextResponse.json({ error: 'lessonId is required' }, { status: 400 });
        }

        // Buscar el tracking más reciente para esta lección y usuario
        const { data: tracking, error } = await supabase
            .from('lesson_tracking')
            .select('video_checkpoint_seconds, video_playback_rate, status, video_total_duration_seconds, video_max_seconds')
            .eq('user_id', user.id)
            .eq('lesson_id', lessonId)
            .order('last_activity_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            techDebtLogger.error('[Resume API] Error fetching tracking:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        // Si no hay tracking previo, retornar valores por defecto
        if (!tracking) {
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

        return NextResponse.json({
            checkpointSeconds: tracking.video_checkpoint_seconds || 0,
            playbackRate: tracking.video_playback_rate || 1.0,
            hasWatched: tracking.video_max_seconds > 0,
            completionPercentage,
            status: tracking.status
        });
    } catch (error) {
        techDebtLogger.error('[Resume API] Unexpected error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? String(error) : undefined
        }, { status: 500 });
    }
}
