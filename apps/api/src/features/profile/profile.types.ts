import { z } from 'zod'

export const updateProfileBodySchema = z.object({
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  display_name: z.string().max(150).optional(),
  bio: z.string().max(1000).optional(),
  location: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileBodySchema>

export interface UserProfile {
  id: string
  username: string
  email: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  bio: string | null
  location: string | null
  phone: string | null
  profile_picture_url: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
}
