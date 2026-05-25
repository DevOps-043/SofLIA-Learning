export interface UserAuth {
  userId: string
  userEmail: string
  userRole: string
}

export interface RequireUserOptions {
  allowBanned?: boolean
}
