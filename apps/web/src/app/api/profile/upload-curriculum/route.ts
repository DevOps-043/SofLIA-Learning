import { NextRequest, NextResponse } from 'next/server'
import { logger } from '../../../../lib/logger'
import { createClient } from '../../../../lib/supabase/server'
import {
  PROFILE_CURRICULUM_ALLOWED_TYPES,
  PROFILE_UPLOAD_MAX_SIZE_BYTES
} from '../../../../features/profile/services/profile.shared'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    let {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      const authHeader = request.headers.get('authorization')
      if (authHeader) {
        const {
          data: { user: headerUser },
          error: headerError
        } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
        user = headerUser
        userError = headerError
      }
    }

    if (userError || !user) {
      logger.error('Auth error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!PROFILE_CURRICULUM_ALLOWED_TYPES.includes(file.type as typeof PROFILE_CURRICULUM_ALLOWED_TYPES[number])) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF and Word documents are allowed.' }, { status: 400 })
    }

    if (file.size > PROFILE_UPLOAD_MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-cv-${Date.now()}.${fileExt}`
    const filePath = `curriculums/${fileName}`

    const { error: uploadError } = await supabase.storage.from('curriculums').upload(filePath, file)

    if (uploadError) {
      logger.error('Error uploading curriculum:', uploadError)
      return NextResponse.json({ error: 'Error uploading file' }, { status: 500 })
    }

    const {
      data: { publicUrl }
    } = supabase.storage.from('curriculums').getPublicUrl(filePath)

    const { error: updateError } = await supabase
      .from('users')
      .update({
        curriculum_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      logger.error('Error updating profile:', updateError)
      return NextResponse.json({ error: 'Error updating profile' }, { status: 500 })
    }

    return NextResponse.json({ cvUrl: publicUrl })
  } catch (error) {
    logger.error('Error in upload-curriculum API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
