import type { SupabaseServerClient } from './shared-types'

export async function getInstructorAssetIds(
  supabase: SupabaseServerClient,
  instructorId: string,
) {
  const [{ data: instructorCourses }, { data: instructorCommunities }] =
    await Promise.all([
      supabase.from('courses').select('id').eq('instructor_id', instructorId),
      supabase.from('communities').select('id').eq('creator_id', instructorId),
    ])

  return {
    courseIds: (instructorCourses ?? []).map((course) => course.id),
    communityIds: (instructorCommunities ?? []).map((community) => community.id),
  }
}
