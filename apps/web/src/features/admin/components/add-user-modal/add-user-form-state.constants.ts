import type { NewAdminUserData } from './add-user-form-state.types'

export const INITIAL_ADD_USER_FORM: NewAdminUserData = {
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  display_name: '',
  cargo_rol: 'Usuario',
  type_rol: '',
  phone: '',
  date_of_birth: '',
  gender: '',
  bio: '',
  location: '',
  profile_picture_url: '',
  curriculum_url: '',
  linkedin_url: '',
  github_url: '',
  website_url: '',
  points: 0,
  country_code: '',
}
