export interface ProvisionAuthAccountInput {
  cargoRol: string
  countryCode?: string | null
  dateOfBirth?: string | null
  displayName?: string | null
  email: string
  emailVerified?: boolean
  firstName?: string | null
  gender?: string | null
  lastName?: string | null
  password: string
  phone?: string | null
  profilePictureUrl?: string | null
  userId?: string
  username: string
}

export interface ProvisionedAuthAccount {
  authUserId: string
  userId: string
}
