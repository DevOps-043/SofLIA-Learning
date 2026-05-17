import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { createClient } from '../../../lib/supabase/server';

import { SessionService } from '../../../features/auth/services/session.service';

interface AccountSettingsUpdateData {
  profile_visibility?: string
  show_email?: boolean
  show_activity?: boolean
  notification_email?: boolean
  notification_push?: boolean
  notification_marketing?: boolean
  notification_course_updates?: boolean
  notification_community_updates?: boolean
}

const AccountSettingsSchema = z.object({
  privacy: z.object({
    profileVisibility: z.enum(['public', 'private', 'friends']).optional(),
    showEmail: z.boolean().optional(),
    showActivity: z.boolean().optional(),
  }).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    marketing: z.boolean().optional(),
    courseUpdates: z.boolean().optional(),
    communityUpdates: z.boolean().optional(),
  }).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Obtener configuración de privacidad y notificaciones del usuario
    const { data: userData, error } = await supabase
      .from('users')
      .select('profile_visibility, show_email, show_activity, notification_email, notification_push, notification_marketing, notification_course_updates, notification_community_updates')
      .eq('id', user.id)
      .single();

    if (error) {
      // Si no existe el campo, devolver valores por defecto
      return NextResponse.json({
        privacy: {
          profileVisibility: 'public',
          showEmail: false,
          showActivity: true,
        },
        notifications: {
          email: true,
          push: true,
          marketing: false,
          courseUpdates: true,
          communityUpdates: false,
        },
      });
    }

    return NextResponse.json({
      privacy: {
        profileVisibility: userData?.profile_visibility || 'public',
        showEmail: userData?.show_email || false,
        showActivity: userData?.show_activity !== undefined ? userData.show_activity : true,
      },
      notifications: {
        email: userData?.notification_email !== undefined ? userData.notification_email : true,
        push: userData?.notification_push !== undefined ? userData.notification_push : true,
        marketing: userData?.notification_marketing || false,
        courseUpdates: userData?.notification_course_updates !== undefined ? userData.notification_course_updates : true,
        communityUpdates: userData?.notification_community_updates || false,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener la configuración' },
      { status: 500 }
    );
  }
}
