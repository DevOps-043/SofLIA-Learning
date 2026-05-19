import { NextRequest, NextResponse } from 'next/server'

import { SessionService } from '@/features/auth/services/session.service'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { createClient } from '@/lib/supabase/server'

import { accountSettingsSchema, type AccountSettingsBody } from './schema'

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

async function handlePost(_request: NextRequest, body: AccountSettingsBody) {
  const user = await SessionService.getCurrentUser()
  if (!user) {
    return apiError('UNAUTHORIZED', 'No autorizado', 401)
  }

  const privacy = body.privacy ?? {}
  const notifications = body.notifications ?? {}

  const updateData: AccountSettingsUpdateData = {}
  if (privacy.profileVisibility !== undefined)
    updateData.profile_visibility = privacy.profileVisibility
  if (privacy.showEmail !== undefined)
    updateData.show_email = privacy.showEmail
  if (privacy.showActivity !== undefined)
    updateData.show_activity = privacy.showActivity
  if (notifications.email !== undefined)
    updateData.notification_email = notifications.email
  if (notifications.push !== undefined)
    updateData.notification_push = notifications.push
  if (notifications.marketing !== undefined)
    updateData.notification_marketing = notifications.marketing
  if (notifications.courseUpdates !== undefined)
    updateData.notification_course_updates = notifications.courseUpdates
  if (notifications.communityUpdates !== undefined)
    updateData.notification_community_updates = notifications.communityUpdates

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)

    if (error) {
      return apiError(
        'SAVE_SETTINGS_FAILED',
        'Error al guardar la configuración',
        500,
      )
    }

    return NextResponse.json({
      message: 'Configuración guardada exitosamente',
      privacy,
      notifications,
    })
  } catch {
    return apiError(
      'SAVE_SETTINGS_FAILED',
      'Error al guardar la configuración',
      500,
    )
  }
}

export const POST = withZodBody(accountSettingsSchema, handlePost)
