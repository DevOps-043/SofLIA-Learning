export interface PasswordResetTemplateInput {
  resetUrl: string;
  username: string;
  year?: number;
}

export interface OrganizationInvitationTemplateInput {
  registerUrl: string;
  organizationName: string;
  customMessage?: string;
  organizationLogoUrl?: string;
  appUrl?: string;
  year?: number;
}
