import { NextResponse } from 'next/server';
import { SessionService } from '@/features/auth/services/session.service';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordSecurityEvent } from '@/lib/security/security-events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await SessionService.getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const [
    profile,
    organizations,
    enrollments,
    lessonProgress,
    certificates,
    conversations,
    notifications,
  ] = await Promise.all([
    supabase
      .from('users')
      .select('id, username, email, first_name, last_name, display_name, phone, bio, location, country_code, date_of_birth, gender, platform_role, profile_picture_url, notification_email, notification_push, notification_marketing, notification_course_updates, notification_community_updates, created_at, updated_at, last_login_at')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('organization_users')
      .select('id, organization_id, role, status, job_title, job_description, joined_at, invited_at, created_at, updated_at')
      .eq('user_id', user.id),
    supabase
      .from('user_course_enrollments')
      .select('enrollment_id, course_id, organization_id, enrollment_status, overall_progress_percentage, enrolled_at, started_at, completed_at, last_accessed_at, created_at, updated_at')
      .eq('user_id', user.id),
    supabase
      .from('user_lesson_progress')
      .select('progress_id, enrollment_id, lesson_id, organization_id, lesson_status, is_completed, video_progress_percentage, quiz_progress_percentage, activity_progress_percentage, required_activities_completed, required_activities_total, started_at, completed_at, last_accessed_at, time_spent_minutes, created_at, updated_at')
      .eq('user_id', user.id),
    supabase
      .from('user_course_certificates')
      .select('certificate_id, course_id, enrollment_id, organization_id, certificate_url, issued_at, expires_at, created_at')
      .eq('user_id', user.id),
    supabase
      .from('lia_conversations')
      .select('conversation_id, organization_id, context_type, conversation_title, course_id, lesson_id, activity_id, started_at, ended_at, conversation_completed, total_messages, created_at, updated_at')
      .eq('user_id', user.id),
    supabase
      .from('user_notifications')
      .select('notification_id, organization_id, title, message, notification_type, status, priority, created_at, read_at')
      .eq('user_id', user.id),
  ]);

  if (profile.error) {
    return NextResponse.json({ error: 'No se pudo exportar el perfil' }, { status: 500 });
  }

  const conversationIds = (conversations.data ?? []).map((conversation) => conversation.conversation_id);
  const messages = conversationIds.length > 0
    ? await supabase
        .from('lia_messages')
        .select('message_id, conversation_id, role, content, message_sequence, created_at, model_used, tokens_used')
        .in('conversation_id', conversationIds)
    : { data: [], error: null };

  if (messages.error) {
    return NextResponse.json({ error: 'No se pudieron exportar mensajes' }, { status: 500 });
  }

  recordSecurityEvent('privacy-export', {
    actorId: user.id,
    actorRole: user.platform_role,
    resourceType: 'user',
    resourceId: user.id,
  });

  return NextResponse.json(
    {
      exportedAt: new Date().toISOString(),
      subject: {
        id: user.id,
      },
      profile: profile.data,
      organizations: organizations.data ?? [],
      learning: {
        enrollments: enrollments.data ?? [],
        lessonProgress: lessonProgress.data ?? [],
        certificates: certificates.data ?? [],
      },
      assistant: {
        conversations: conversations.data ?? [],
        messages: messages.data ?? [],
      },
      notifications: notifications.data ?? [],
    },
    {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
      },
    },
  );
}
