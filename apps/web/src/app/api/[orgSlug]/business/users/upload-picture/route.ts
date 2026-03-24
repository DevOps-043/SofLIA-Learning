import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { createClient } from '@supabase/supabase-js'
import { requireBusiness } from '@/lib/auth/requireBusiness'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
    try {
        const { orgSlug } = await params
        const auth = await requireBusiness({ organizationSlug: orgSlug })
        if (auth.error) {
            return NextResponse.json({ error: auth.error }, { status: auth.status })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)
        const formData = await request.formData()
        const file = formData.get('file') as File
        const targetUserId = formData.get('userId') as string | null

        if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

        // Si se proporciona un userId, validar que pertenece a la organización
        if (targetUserId) {
            const { data: belongs } = await supabase
                .from('organization_users')
                .select('user_id')
                .eq('organization_id', auth.organizationId)
                .eq('user_id', targetUserId)
                .maybeSingle()
            
            if (!belongs) {
                return NextResponse.json({ error: 'Usuario no pertenece a la organización' }, { status: 403 })
            }
        }

        const filePath = `profile-pictures/${targetUserId || 'new'}-${Date.now()}`
        const { data, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file)

        if (uploadError) return NextResponse.json({ error: 'Upload failed' }, { status: 500 })

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)

        if (targetUserId) {
            await supabase.from('users').update({ profile_picture_url: publicUrl }).eq('id', targetUserId)
        }

        return NextResponse.json({ imageUrl: publicUrl })
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
