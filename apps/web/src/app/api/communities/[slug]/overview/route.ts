import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient()
    const { slug } = await params

    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id, name, description, slug, image_url, member_count, created_at, creator_id, category, access_type, visibility')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (communityError || !community) {
      logger.error('❌ Community overview not found', communityError)
      return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 })
    }

    const [
      creatorResult,
      adminMembersResult,
      postsCountResult,
      recentMembersResult
    ] = await Promise.all([
      community.creator_id
        ? supabase
            .from('users')
            .select('id, display_name, first_name, last_name, profile_picture_url, cargo_rol')
            .eq('id', community.creator_id)
            .single()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from('community_members')
        .select(
          `role,
           users:users!community_members_user_id_fkey (
             id,
             display_name,
             profile_picture_url
           )`
        )
        .eq('community_id', community.id)
        .in('role', ['admin', 'moderator'])
        .limit(5),
      supabase
        .from('community_posts')
        .select('id', { count: 'exact', head: true })
        .eq('community_id', community.id),
      supabase
        .from('community_members')
        .select(
          `joined_at,
           role,
           users:users!community_members_user_id_fkey (
             id,
             display_name,
             profile_picture_url
           )`
        )
        .eq('community_id', community.id)
        .order('joined_at', { ascending: false })
        .limit(6)
    ])

    const creator = creatorResult?.data || null
    const admins =
      adminMembersResult?.data?.map((member) => ({
        id: member.users?.id,
        display_name: member.users?.display_name,
        profile_picture_url: member.users?.profile_picture_url,
        role: member.role
      })) || []

    const recentMembers =
      recentMembersResult?.data
        ?.filter((member) => !!member.users)
        .map((member) => ({
          id: member.users!.id,
          display_name: member.users!.display_name,
          profile_picture_url: member.users!.profile_picture_url,
          role: member.role,
          joined_at: member.joined_at
        })) || []

    const postsCount = postsCountResult?.count || 0

    return NextResponse.json({
      overview: {
        ...community,
        stats: {
          members: community.member_count || recentMembers.length,
          posts: postsCount,
          createdAt: community.created_at
        },
        creator,
        admins,
        recentMembers
      }
    })
  } catch (error) {
    logger.error('❌ Error generating community overview', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

