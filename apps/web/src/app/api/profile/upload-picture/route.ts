import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '../../../../features/auth/services/session.service'
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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const uploadValidation = await validateAndPrepareUpload(file, 'avatars')
    if (!uploadValidation.valid || !uploadValidation.file) {
      return NextResponse.json(
        { error: uploadValidation.error || 'Archivo no permitido' },
        { status: 400 },
      )
    }

    const preparedFile = uploadValidation.file
    const fileName = `${user.id}-${generateSafeFileName(file.name, preparedFile.detectedExtension)}`
    const filePath = `profile-pictures/${fileName}`

    logger.info('Uploading profile picture', {
      userId: user.id,
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
