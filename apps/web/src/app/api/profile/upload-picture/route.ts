import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js'
import { SessionService } from '../../../../features/auth/services/session.service'

export async function POST(request: NextRequest) {
  try {
    // Usar SessionService para obtener el usuario actual (sistema de autenticación personalizado)
    const user = await SessionService.getCurrentUser()

    if (!user) {
      logger.error('Auth error: No user found in session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Crear cliente con service role key para bypass de RLS (dentro de la función para evitar error en build)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validar tipo de archivo (coincide con configuración del bucket: image/png, image/jpeg, image/jpg, image/gif)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de archivo no válido. Solo se permiten PNG, JPEG, JPG y GIF.' 
      }, { status: 400 })
    }

    // Validar tamaño (máximo 10MB según configuración del bucket)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'El archivo es demasiado grande. Máximo 10MB.' 
      }, { status: 400 })
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `profile-pictures/${fileName}`

    logger.info('Uploading profile picture', {
      userId: user.id,
      fileName,
      filePath,
      fileSize: file.size
    })

    // Subir archivo a Supabase Storage usando service role key (bypass RLS)
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (uploadError) {
      logger.error('Error uploading profile picture:', uploadError)
      return NextResponse.json({ 
        error: 'Error uploading file',
        message: uploadError.message 
      }, { status: 500 })
    }

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    // Actualizar perfil con nueva URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        profile_picture_url: publicUrl,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', user.id)

    if (updateError) {
      logger.error('Error updating profile:', updateError)
      return NextResponse.json({ error: 'Error updating profile' }, { status: 500 })
    }
    
    return NextResponse.json({ imageUrl: publicUrl })
  } catch (error) {
    logger.error('Error in upload-picture API:', error)
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
