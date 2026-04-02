import { NextRequest, NextResponse } from 'next/server'
import { logger } from '../../../../lib/logger'
import { createClient } from '@supabase/supabase-js'
import { SessionService } from '../../../../features/auth/services/session.service'
import {
  PROFILE_IMAGE_ALLOWED_TYPES,
  PROFILE_UPLOAD_MAX_SIZE_BYTES
} from '../../../../features/profile/services/profile.shared'

export async function POST(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser()

    if (!user) {
      logger.error('Auth error: No user found in session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!PROFILE_IMAGE_ALLOWED_TYPES.includes(file.type as typeof PROFILE_IMAGE_ALLOWED_TYPES[number])) {
      return NextResponse.json({ error: 'Tipo de archivo no válido. Solo se permiten PNG, JPEG, JPG y GIF.' }, { status: 400 })
    }

    if (file.size > PROFILE_UPLOAD_MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'El archivo es demasiado grande. Máximo 10MB.' }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `profile-pictures/${fileName}`

    logger.info('Uploading profile picture', {
      userId: user.id,
      fileName,
      filePath,
      fileSize: file.size
    })

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (uploadError) {
      logger.error('Error uploading profile picture:', uploadError)
      return NextResponse.json({ error: 'Error uploading file' }, { status: 500 })
    }

    const {
      data: { publicUrl }
    } = supabase.storage.from('avatars').getPublicUrl(filePath)

    const { error: updateError } = await supabase
      .from('users')
      .update({
        profile_picture_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      logger.error('Error updating profile:', updateError)
      return NextResponse.json({ error: 'Error updating profile' }, { status: 500 })
    }

    return NextResponse.json({ imageUrl: publicUrl })
  } catch (error) {
    logger.error('Error in upload-picture API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
