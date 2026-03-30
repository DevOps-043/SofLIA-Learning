import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    
    const { slug } = await params
    const supabase = await createClient()

    // Debug: Obtener comunidad básica
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('*')
      .eq('slug', slug)
      .single()

    if (communityError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Community not found',
        details: communityError 
      })
    }

    // Debug: Obtener miembros
    const { data: members, error: membersError } = await supabase
      .from('community_members')
      .select('*')
      .eq('community_id', community.id)
      .limit(5)

    // Debug: Obtener posts
    const { data: posts, error: postsError } = await supabase
      .from('community_posts')
      .select('*')
      .eq('community_id', community.id)
      .limit(5)

    // Debug: Obtener usuarios
    const userIds = [
      ...(members?.map(m => m.user_id) || []),
      ...(posts?.map(p => p.user_id) || [])
    ].filter(Boolean)

    let users = []
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, display_name, first_name, last_name, email')
        .in('id', userIds)
      
      users = usersData || []
    }

    return NextResponse.json({
      success: true,
      debug: {
        community,
        members: members || [],
        posts: posts || [],
        users,
        errors: {
          community: communityError,
          members: membersError,
          posts: postsError
        }
      }
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 500 })
  }
}
