'use client';

import type { ComponentProps, JSX } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { GoogleLoginButton } from '../GoogleLoginButton/GoogleLoginButton';
import { MicrosoftLoginButton } from '../MicrosoftLoginButton/MicrosoftLoginButton';

const SafeLink = Link as unknown as (
  props: ComponentProps<typeof Link>
) => JSX.Element;

interface SocialLoginButtonsProps {
  googleEnabled?: boolean;
  microsoftEnabled?: boolean;
  organizationSlug?: string;
  organizationId?: string;
  invitationToken?: string;
  bulkInviteToken?: string;
  showLoginLink?: boolean;
}

export function SocialLoginButtons({
  googleEnabled = true,
  microsoftEnabled = true,
  organizationSlug,
  organizationId,
  invitationToken,
  bulkInviteToken,
  showLoginLink = false
}: SocialLoginButtonsProps) {
  const hasAnyProvider = googleEnabled || microsoftEnabled;

  return (
    <div className="space-y-3">
      {/* Divisor "O continuar con" - solo si hay providers */}
      {hasAnyProvider && (
        <div className="relative py-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-white/20"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 text-xs font-medium text-gray-500 dark:text-white/60 bg-white dark:bg-transparent">
              O continuar con
            </span>
          </div>
        </div>
      )}

      {/* Botones de providers en fila horizontal */}
      {hasAnyProvider && (
        <div className="flex items-center justify-center gap-3">
          {googleEnabled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <GoogleLoginButton
                organizationId={organizationId}
                organizationSlug={organizationSlug}
                invitationToken={invitationToken}
                bulkInviteToken={bulkInviteToken}
              />
            </motion.div>
          )}

          {microsoftEnabled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              <MicrosoftLoginButton
                organizationId={organizationId}
                organizationSlug={organizationSlug}
                invitationToken={invitationToken}
                bulkInviteToken={bulkInviteToken}
              />
            </motion.div>
          )}
        </div>
      )}

      {/* Login Link */}
      {showLoginLink && organizationSlug && (
        <motion.div
          className="text-center pt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <p className="text-sm text-gray-600 dark:text-white/70">
            ¿Ya tienes cuenta?{' '}
            <SafeLink
              href={`/auth/${organizationSlug}${
                invitationToken 
                  ? `?invitation_token=${invitationToken}` 
                  : bulkInviteToken 
                    ? `?bulk_token=${bulkInviteToken}` 
                    : ''
              }`}
              className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
            >
              Iniciar sesión
            </SafeLink>
          </p>
        </motion.div>
      )}
    </div>
  );
}
