export interface UserProfileRecord {
  id: string
  username: string
  email: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  date_of_birth: string | null
  gender: string | null
  last_login_at?: string | null
  updated_at?: string | null
}
