import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '../../../../features/auth/services/session.service'
import { requireBusiness } from '../../../../lib/auth/requireBusiness'
import { logger } from '../../../../lib/logger'
import { generateSafeFileName } from '../../../../lib/upload/validation'
import { validateAndPrepareUpload } from '../../../../lib/upload/validation.server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      logger.error('Auth error: No user found in session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Storage no configurado' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const formData = await request.formData()
    const fileValue = formData.get('file')
    const file = fileValue instanceof File ? fileValue : null
    const targetUserId = formData.get('targetUserId')
    const organizationSlug = formData.get('organizationSlug')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    let ownerUserId = user.id

    if (typeof targetUserId === 'string' && targetUserId && targetUserId !== user.id) {
      if (typeof organizationSlug !== 'string' || !organizationSlug) {
        return NextResponse.json(
          { error: 'organizationSlug es requerido para editar la foto de otro usuario' },
          { status: 400 },
        )
      }

      const auth = await requireBusiness({ organizationSlug })
      if (auth instanceof NextResponse) return auth

      if (!auth.organizationId) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }

      const { data: membership } = await supabase
        .from('organization_users')
        .select('user_id')
        .eq('organization_id', auth.organizationId)
        .eq('user_id', targetUserId)
        .maybeSingle()

      if (!membership) {
        return NextResponse.json(
          { error: 'El usuario no pertenece a esta organizacion' },
          { status: 403 },
        )
      }

      ownerUserId = targetUserId
    }

    const uploadValidation = await validateAndPrepareUpload(file, 'avatars')
    if (!uploadValidation.valid || !uploadValidation.file) {
      return NextResponse.json(
        { error: uploadValidation.error || 'Archivo no permitido' },
        { status: 400 },
      )
    }

    const preparedFile = uploadValidation.file
    const fileName = `${ownerUserId}-${generateSafeFileName(file.name, preparedFile.detectedExtension)}`
    const filePath = `profile-pictures/${fileName}`

    logger.info('Uploading profile picture', {
      userId: ownerUserId,
      fileName,
      filePath,
      fileSize: preparedFile.sizeBytes,
    })

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, preparedFile.body, {
        cacheControl: '3600',
        contentType: preparedFile.contentType,
        upsert: false,
      })

    if (uploadError) {
      logger.error('Error uploading profile picture:', uploadError)
      return NextResponse.json({ error: 'Error uploading file' }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(filePath)

    const { error: updateError } = await supabase
      .from('users')
      .update({
        profile_picture_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ownerUserId)

    if (updateError) {
      logger.error('Error updating profile:', updateError)
      return NextResponse.json({ error: 'Error updating profile' }, { status: 500 })
    }

    await notifyProfilePictureUpdatedBestEffort(ownerUserId)

    return NextResponse.json({ imageUrl: publicUrl })
  } catch (error) {
    logger.error('Error in upload-picture API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      logger.error('Auth error: No user found in session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Storage no configurado' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data: currentProfile, error: fetchError } = await supabase
      .from('users')
      .select('profile_picture_url')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      logger.error('Error fetching profile picture before delete:', fetchError)
      return NextResponse.json({ error: 'Error fetching profile' }, { status: 500 })
    }

    const currentUrl = currentProfile?.profile_picture_url || ''
    const storagePath = resolveAvatarStoragePath(currentUrl)

    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from('avatars')
        .remove([storagePath])

      if (storageError) {
        logger.warn('Profile picture storage delete failed:', {
          error: storageError.message,
          storagePath,
          userId: user.id,
        })
      }
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({
        profile_picture_url: '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      logger.error('Error clearing profile picture:', updateError)
      return NextResponse.json({ error: 'Error updating profile' }, { status: 500 })
    }

    await notifyProfilePictureUpdatedBestEffort(user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error in delete upload-picture API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

function resolveAvatarStoragePath(imageUrl: string): string | null {
  if (!imageUrl) return null

  const publicObjectMarker = '/storage/v1/object/public/avatars/'

  try {
    const parsedUrl = new URL(imageUrl)
    const markerIndex = parsedUrl.pathname.indexOf(publicObjectMarker)
    if (markerIndex >= 0) {
      return decodeURIComponent(parsedUrl.pathname.slice(markerIndex + publicObjectMarker.length))
    }
  } catch {
    const markerIndex = imageUrl.indexOf(publicObjectMarker)
    if (markerIndex >= 0) {
      return decodeURIComponent(imageUrl.slice(markerIndex + publicObjectMarker.length))
    }
  }

  return imageUrl.startsWith('profile-pictures/') ? imageUrl : null
}

async function notifyProfilePictureUpdatedBestEffort(userId: string) {
  try {
    const { AutoNotificationsService } = await import(
      '@/features/notifications/services/auto-notifications.service'
    )
    await AutoNotificationsService.notifyProfileUpdated(userId, ['profile_picture_url'], {
      action_url: '/profile',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    logger.warn('No se pudo crear notificacion de foto de perfil:', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    })
  }
}
