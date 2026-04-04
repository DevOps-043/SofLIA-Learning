import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { createClient } from '@supabase/supabase-js'
import { requireBusiness } from '@/lib/auth/requireBusiness'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
    try {
        // Verify business authorization
        const auth = await requireBusiness()
        if (auth.error) {
            return NextResponse.json({ error: auth.error }, { status: auth.status })
        }

        // Create client with service role key to bypass RLS
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const formData = await request.formData()
        const file = formData.get('file') as File
        const userId = formData.get('userId') as string | null

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Validate file type (matching bucket config: image/png, image/jpeg, image/jpg, image/gif)
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                error: 'Tipo de archivo no válido. Solo se permiten PNG, JPEG, JPG y GIF.'
            }, { status: 400 })
        }

        // Validate size (max 10MB as per bucket config)
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
            return NextResponse.json({
                error: 'El archivo es demasiado grande. Máximo 10MB.'
            }, { status: 400 })
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const uniqueId = userId || `new-${Date.now()}`
        const fileName = `${uniqueId}-${Date.now()}.${fileExt}`
        const filePath = `profile-pictures/${fileName}`

        logger.info('Uploading user profile picture', {
            organizationId: auth.organizationId,
            fileName,
            filePath,
            fileSize: file.size
        })

        // Upload file to Supabase Storage using service role key (bypass RLS)
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

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath)

        // If userId was provided, update the user's profile
        if (userId) {
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    profile_picture_url: publicUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)

            if (updateError) {
                logger.error('Error updating user profile:', updateError)
                // Don't fail the request, image was uploaded successfully
            }
        }

        return NextResponse.json({ imageUrl: publicUrl })
    } catch (error) {
        logger.error('Error in business upload-picture API:', error)
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
