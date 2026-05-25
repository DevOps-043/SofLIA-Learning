export interface EmailContent {
  html: string
  text: string
}

export interface PasswordResetTemplateInput {
  resetUrl: string
  username: string
  year?: number
}

export interface OrganizationInvitationTemplateInput {
  registerUrl: string
  organizationName: string
  customMessage?: string
  organizationLogoUrl?: string
  appUrl?: string
  year?: number
}

export interface OrganizationInvitationViewModel {
  year: number
  registerUrl: string
  organizationName: string
  normalizedCustomMessage?: string
  safeRegisterUrl: string
  safeOrganizationName: string
  safeCustomMessage: string
  safeOrgLogoUrl?: string
  safeSofliaLogoUrl: string
}
