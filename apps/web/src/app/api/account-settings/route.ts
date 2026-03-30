import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { SessionService } from '../../../features/auth/services/session.service';

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

export async function POST(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { privacy, notifications } = body;

    if (!privacy || !notifications) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Actualizar configuración en la base de datos
    const updateData: any = {};
    
    if (privacy.profileVisibility !== undefined) {
      updateData.profile_visibility = privacy.profileVisibility;
    }
    if (privacy.showEmail !== undefined) {
      updateData.show_email = privacy.showEmail;
    }
    if (privacy.showActivity !== undefined) {
      updateData.show_activity = privacy.showActivity;
    }
    
    if (notifications.email !== undefined) {
      updateData.notification_email = notifications.email;
    }
    if (notifications.push !== undefined) {
      updateData.notification_push = notifications.push;
    }
    if (notifications.marketing !== undefined) {
      updateData.notification_marketing = notifications.marketing;
    }
    if (notifications.courseUpdates !== undefined) {
      updateData.notification_course_updates = notifications.courseUpdates;
    }
    if (notifications.communityUpdates !== undefined) {
      updateData.notification_community_updates = notifications.communityUpdates;
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (error) {
      return NextResponse.json(
        { error: 'Error al guardar la configuración' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Configuración guardada exitosamente',
      privacy,
      notifications,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al guardar la configuración' },
      { status: 500 }
    );
  }
}

