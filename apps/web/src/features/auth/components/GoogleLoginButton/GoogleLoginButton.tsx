'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { initiateGoogleLogin } from '../../actions/oauth';

// SVG del logo de Google
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
    <path
      d="M17.64 9.20443C17.64 8.56625 17.5827 7.95262 17.4764 7.36353H9V10.8449H13.8436C13.635 11.9699 13.0009 12.9231 12.0477 13.5613V15.8194H14.9564C16.6582 14.2526 17.64 11.9453 17.64 9.20443Z"
      fill="#4285F4"
    />
    <path
      d="M8.99976 18C11.4298 18 13.467 17.1941 14.9561 15.8195L12.0475 13.5613C11.2416 14.1013 10.2107 14.4204 8.99976 14.4204C6.65567 14.4204 4.67158 12.8372 3.96385 10.71H0.957031V13.0418C2.43794 15.9831 5.48158 18 8.99976 18Z"
      fill="#34A853"
    />
    <path
      d="M3.96409 10.7098C3.78409 10.1698 3.68182 9.59301 3.68182 8.99983C3.68182 8.40665 3.78409 7.82983 3.96409 7.28983V4.95801H0.957273C0.347727 6.17301 0 7.54756 0 8.99983C0 10.4521 0.347727 11.8266 0.957273 13.0416L3.96409 10.7098Z"
      fill="#FBBC05"
    />
    <path
      d="M8.99976 3.57955C10.3211 3.57955 11.5075 4.03364 12.4402 4.92545L15.0216 2.34409C13.4629 0.891818 11.4257 0 8.99976 0C5.48158 0 2.43794 2.01682 0.957031 4.95818L3.96385 7.29C4.67158 5.16273 6.65567 3.57955 8.99976 3.57955Z"
      fill="#EA4335"
    />
  </svg>
);

interface GoogleLoginButtonProps {
  /** ID de la organización (para registro B2B) */
  organizationId?: string;
  /** Slug de la organización (para registro B2B) */
  organizationSlug?: string;
  /** Token de invitación individual (para registro con invitación) */
  invitationToken?: string;
  /** Token de enlace de invitación masiva */
  bulkInviteToken?: string;
}

export function GoogleLoginButton({
  organizationId,
  organizationSlug,
  invitationToken,
  bulkInviteToken
}: GoogleLoginButtonProps = {}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await initiateGoogleLogin({
        organizationId,
        organizationSlug,
        invitationToken,
        bulkInviteToken,
      });
    } catch (error) {
      // Verificar si es una redirección de Next.js (no es un error real)
      if (error && typeof error === 'object' && 'digest' in error) {
        const digest = (error as any).digest;
        if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
          // Es una redirección exitosa, dejar que Next.js la maneje
          // No resetear isLoading - la página se redirigirá
          return;
        }
      }

      // Solo es un error real si llegamos aquí
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className="
        w-14 h-14
        rounded-xl
        bg-white dark:bg-[#1E2329]
        border border-[#E9ECEF] dark:border-[#6C757D]/30
        hover:bg-gray-50 dark:hover:bg-[#2A2F35]
        hover:border-[#00D4B3] dark:hover:border-[#00D4B3]
        focus:outline-none focus:ring-2 focus:ring-[#00D4B3] focus:ring-opacity-20
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-300
        flex items-center justify-center
        shadow-md hover:shadow-lg hover:shadow-[#00D4B3]/10
      "
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-[#0A2540] dark:text-white" />
      ) : (
        <GoogleIcon />
      )}
    </motion.button>
  );
}
