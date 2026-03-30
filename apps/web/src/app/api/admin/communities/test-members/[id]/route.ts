import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params
    const supabase = await createClient()

    // 1. Obtener la comunidad
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id, name, slug')
      .eq('id', communityId)
      .single()

    if (communityError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Community not found',
        details: communityError 
      })
    }

    // 2. Obtener miembros de la comunidad
    const { data: members, error: membersError } = await supabase
      .from('community_members')
      .select('*')
      .eq('community_id', communityId)

    if (membersError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Error fetching members',
        details: membersError 
      })
    }

    if (!members || members.length === 0) {
      return NextResponse.json({
        success: true,
        community,
        members: [],
        users: [],
        message: 'No members found for this community'
      })
    }

    // 3. Obtener IDs de usuarios únicos
    const userIds = [...new Set(members.map(member => member.user_id))]
    // 4. Obtener información de usuarios
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, display_name, first_name, last_name, email, profile_picture_url, cargo_rol')
      .in('id', userIds)

    // 5. Combinar datos
    const membersWithUsers = members.map(member => {
      const user = users?.find(u => u.id === member.user_id)
      return {
        member,
        user: user || null,
        combined: {
          ...member,
          users: user || {
            id: member.user_id,
            display_name: 'Usuario no encontrado',
            first_name: 'Usuario',
            last_name: 'No encontrado',
            email: 'email@noencontrado.com',
            profile_picture_url: null,
            cargo_rol: 'Usuario'
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      community,
      members,
      users,
      membersWithUsers,
      errors: {
        community: communityError,
        members: membersError,
        users: usersError
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
