'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, AlertCircle, Eye, EyeOff, Lock, Check } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SocialLoginButtons } from '../SocialLoginButtons/SocialLoginButtons';
import { LoginFormData } from '../../types/auth.types';
import { loginSchema } from '../LoginForm/LoginForm.schema';
import { loginAction } from '../../actions/login';
import { getSavedCredentials, saveCredentials, clearSavedCredentials } from '../../../../lib/auth/remember-me';
import { hexToRgb } from '../../../business-panel/utils/styles';
import type { StyleConfig } from '../../../business-panel/hooks/useOrganizationStyles';
import { useThemeStore } from '../../../../core/stores/themeStore';

interface OrganizationLoginFormProps {
  organizationId: string;
  organizationSlug: string;
  googleLoginEnabled?: boolean;
  microsoftLoginEnabled?: boolean;
}

interface LoginStyles {
  primary_button_color?: string;
  secondary_button_color?: string;
  card_background?: string;
  text_color?: string;
  border_color?: string;
}

export function OrganizationLoginForm({
  organizationId,
  organizationSlug,
  googleLoginEnabled,
  microsoftLoginEnabled,
}: OrganizationLoginFormProps) {
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const [mounted, setMounted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : true; 

  const searchParams = useSearchParams();
  const invitationToken = searchParams?.get('invitation_token');
  const bulkInviteToken = searchParams?.get('bulk_token');

  const [error, setError] = useState<string | null>(null);
  const [redirectInfo, setRedirectInfo] = useState<{ to: string; message: string; countdown: number } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const redirectUrlRef = useRef<string | null>(null);
  const [loginStyles, setLoginStyles] = useState<LoginStyles | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Obtener estilos de login desde la API
  useEffect(() => {
    const fetchLoginStyles = async () => {
      try {
        const response = await fetch(`/api/organizations/${organizationSlug}/styles`, {
          credentials: 'include',
        });

        const data = await response.json();
        if (data.success && data.styles?.login) {
          setLoginStyles(data.styles.login);
        }
      } catch (error) {
      }
    };

    if (organizationSlug) {
      fetchLoginStyles();
    }
  }, [organizationSlug]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
    setValue,
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: '',
      password: '',
      rememberMe: false,
    },
  });

  // Calcular estilos dinámicos - Adaptativos
  const defaultCardBg = isDark ? '#1a1a2e' : 'rgba(255, 255, 255, 0.9)';
  const defaultText = isDark ? '#ffffff' : '#0f172a';
  const defaultBorder = isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(226, 232, 240, 0.8)';
  
  const primaryColor = loginStyles?.primary_button_color || '#3b82f6';
  const secondaryColor = loginStyles?.secondary_button_color || '#10b981';
  const focusColor = '#00D4B3'; // Color fijo para estados de enfoque - siempre visible
  const textColor = loginStyles?.text_color || defaultText;
  const borderColor = loginStyles?.border_color || defaultBorder;
  const cardBg = loginStyles?.card_background || defaultCardBg;

  const inputBgColor = cardBg.startsWith('#')
    ? `rgba(${hexToRgb(cardBg)}, ${isDark ? 0.5 : 0.05})`
    : cardBg.startsWith('rgba')
      ? cardBg.replace(/rgba?\(([^)]+)\)/, (match, p1) => {
        const parts = p1.split(',');
        return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${isDark ? 0.5 : 0.05})`;
      })
      : cardBg;

  // Cargar credenciales guardadas al montar el componente
  useEffect(() => {
    const savedCredentials = getSavedCredentials();
    if (savedCredentials) {
      setValue('emailOrUsername', savedCredentials.emailOrUsername);
      setValue('password', savedCredentials.password);
      setValue('rememberMe', true);
    }
  }, [setValue]);

  // Limpiar intervalo al desmontar componente
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      redirectUrlRef.current = null;
    };
  }, []);

  // Efecto para redirigir cuando countdown llegue a 0
  useEffect(() => {
    if (redirectInfo && redirectInfo.countdown === 0) {
      const urlToRedirect = redirectUrlRef.current || redirectInfo.to;

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      let timeoutId: NodeJS.Timeout | null = null;
      let isCleanedUp = false;

      let finalUrl = urlToRedirect;

      const performRedirect = () => {
        if (!isCleanedUp) {
          timeoutId = setTimeout(() => {
            window.location.href = finalUrl;
          }, 300);
        }
      };

      if (urlToRedirect === '/auth' || urlToRedirect.startsWith('/auth')) {
        if (urlToRedirect === '/auth' || urlToRedirect === '/auth/') {
          finalUrl = '/auth?redirect=force';
        } else if (urlToRedirect.includes('?')) {
          finalUrl = urlToRedirect + '&redirect=force';
        } else {
          finalUrl = urlToRedirect + '?redirect=force';
        }

        fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }).then(() => {
          performRedirect();
        }).catch(() => {
          performRedirect();
        });
      } else {
        performRedirect();
      }

      return () => {
        isCleanedUp = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
    }
  }, [redirectInfo]);

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    setIsPending(true);

    try {
      if (data.rememberMe) {
        saveCredentials({
          emailOrUsername: data.emailOrUsername,
          password: data.password,
        });
      } else {
        clearSavedCredentials();
      }

      // Guardar slug de organización en localStorage para futuras redirecciones
      if (typeof window !== 'undefined' && organizationSlug) {
        try {
          localStorage.setItem('last_organization_slug', organizationSlug);
        } catch (error) {
        }
      }

      const formData = new FormData();
      formData.append('emailOrUsername', data.emailOrUsername);
      formData.append('password', data.password);
      formData.append('rememberMe', data.rememberMe.toString());
      formData.append('organizationId', organizationId);
      formData.append('organizationSlug', organizationSlug);

      if (invitationToken) {
        formData.append('invitationToken', invitationToken);
      }
      if (bulkInviteToken) {
        formData.append('bulkInviteToken', bulkInviteToken);
      }

      const result = await loginAction(formData);

      if (result?.error) {
        if (result.redirectTo && result.redirectMessage) {
          setError(result.error);

          redirectUrlRef.current = result.redirectTo;

          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }

          let countdown = 5;
          setRedirectInfo({
            to: result.redirectTo,
            message: result.redirectMessage,
            countdown: countdown
          });

          countdownIntervalRef.current = setInterval(async () => {
            countdown -= 1;

            if (countdown > 0) {
              setRedirectInfo(prev => {
                if (!prev) return null;
                return { ...prev, countdown };
              });
            } else {
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
              }

              setRedirectInfo(prev => prev ? { ...prev, countdown: 0 } : null);
            }
          }, 1000);

          setIsPending(false);
        } else {
          setError(result.error);
          setIsPending(false);
        }
      } else if (result?.success && result?.redirectTo) {
        // ✅ Login exitoso - navegar a la URL indicada
        // IMPORTANTE: Usar window.location.href para forzar navegación completa
        window.location.href = result.redirectTo;
        // No resetear isPending - la página recargará completamente
      }
    } catch (error: any) {
      if (error && typeof error === 'object') {
        if ('digest' in error) {
          const digest = error.digest;
          if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
            throw error;
          }
        }

        if (error.message && error.message.includes('NEXT_REDIRECT')) {
          throw error;
        }
      }

      setError('Error inesperado al iniciar sesión');
      setIsPending(false);
    }
  };

  const rememberMe = watch('rememberMe');

  return (
    <>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Welcome Message - Minimalista */}
      <motion.div
        className="text-center space-y-2 mb-7"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h2
          className="text-2xl font-semibold tracking-tight"
          style={{ color: textColor }}
        >
          Bienvenido de vuelta
        </h2>
        <p
          className="text-sm opacity-70 font-normal"
          style={{ color: textColor }}
        >
          Ingresa a tu cuenta para continuar
        </p>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="relative overflow-hidden rounded-xl backdrop-blur-sm border p-4"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.4)',
            }}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-sm text-red-300 font-medium leading-snug">{error}</p>
                {redirectInfo && (
                  <div className="flex items-center gap-2 pt-2 border-t border-red-500/20">
                    <motion.div
                      className="w-3 h-3 rounded-full border-2 border-red-400/60 border-t-red-400"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    <p className="text-xs text-red-300/80 flex-1">
                      {redirectInfo.message.replace('5 segundos', `${redirectInfo.countdown} segundo${redirectInfo.countdown !== 1 ? 's' : ''}`)}
                    </p>
                    {redirectInfo.countdown > 0 && (
                      <motion.span
                        key={redirectInfo.countdown}
                        className="inline-flex items-center justify-center min-w-[1.75rem] h-6 px-1.5 rounded-md text-xs font-semibold text-red-200"
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                        }}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {redirectInfo.countdown}
                      </motion.span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email or Username - Diseño completamente nuevo */}
      <motion.div
        className="space-y-1.5"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <label
          htmlFor="emailOrUsername"
          className="block text-xs font-medium uppercase tracking-wider mb-1.5 transition-all duration-200"
          style={{
            color: focusedField === 'emailOrUsername' ? focusColor : textColor,
            opacity: focusedField === 'emailOrUsername' ? 1 : 0.7
          }}
        >
          Correo o Usuario
        </label>
        <div className="relative group">
          {/* Input Container - Diseño minimalista moderno */}
          <motion.div
            className="relative rounded-xl border transition-all duration-300 overflow-hidden"
            style={{
              backgroundColor: focusedField === 'emailOrUsername'
                ? (cardBg.startsWith('#')
                  ? `rgba(${hexToRgb(cardBg)}, 0.7)`
                  : inputBgColor)
                : inputBgColor,
              borderColor: focusedField === 'emailOrUsername'
                ? focusColor
                : errors.emailOrUsername
                  ? '#ef4444'
                  : borderColor,
              borderWidth: focusedField === 'emailOrUsername' ? '2px' : '1px',
              boxShadow: focusedField === 'emailOrUsername'
                ? `0 0 0 3px ${focusColor}20, 0 4px 12px -2px rgba(0, 0, 0, 0.2)`
                : 'none',
            }}
            animate={{
              scale: focusedField === 'emailOrUsername' ? 1.005 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            {/* Focus indicator line */}
            {focusedField === 'emailOrUsername' && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{
                  background: focusColor,
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}

            <div className="flex items-center px-4 py-3">
              <Mail
                className="w-4 h-4 flex-shrink-0 mr-3 transition-colors duration-200"
                style={{
                  color: focusedField === 'emailOrUsername' ? focusColor : `${textColor}50`
                }}
              />
              <input
                id="emailOrUsername"
                type="text"
                placeholder="tu@email.com o usuario"
                {...register('emailOrUsername')}
                onFocus={() => setFocusedField('emailOrUsername')}
                onBlur={() => setFocusedField(null)}
                className="flex-1 w-full bg-transparent outline-none placeholder:opacity-40 transition-colors text-sm font-normal"
                style={{
                  color: textColor,
                }}
              />
            </div>
          </motion.div>
        </div>
        <AnimatePresence>
          {errors.emailOrUsername && (
            <motion.p
              className="text-xs text-red-400 flex items-center gap-1.5 px-1 mt-1"
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span>{errors.emailOrUsername.message}</span>
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Password - Diseño completamente nuevo */}
      <motion.div
        className="space-y-1.5"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <label
          htmlFor="password"
          className="block text-xs font-medium uppercase tracking-wider mb-1.5 transition-all duration-200"
          style={{
            color: focusedField === 'password' ? focusColor : textColor,
            opacity: focusedField === 'password' ? 1 : 0.7
          }}
        >
          Contraseña
        </label>
        <div className="relative group">
          {/* Input Container - Diseño minimalista moderno */}
          <motion.div
            className="relative rounded-xl border transition-all duration-300 overflow-hidden"
            style={{
              backgroundColor: focusedField === 'password'
                ? (cardBg.startsWith('#')
                  ? `rgba(${hexToRgb(cardBg)}, 0.7)`
                  : inputBgColor)
                : inputBgColor,
              borderColor: focusedField === 'password'
                ? focusColor
                : errors.password
                  ? '#ef4444'
                  : borderColor,
              borderWidth: focusedField === 'password' ? '2px' : '1px',
              boxShadow: focusedField === 'password'
                ? `0 0 0 3px ${focusColor}20, 0 4px 12px -2px rgba(0, 0, 0, 0.2)`
                : 'none',
            }}
            animate={{
              scale: focusedField === 'password' ? 1.005 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            {/* Focus indicator line */}
            {focusedField === 'password' && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{
                  background: focusColor,
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}

            <div className="flex items-center px-4 py-3">
              <Lock
                className="w-4 h-4 flex-shrink-0 mr-3 transition-colors duration-200"
                style={{
                  color: focusedField === 'password' ? focusColor : `${textColor}50`
                }}
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                className="flex-1 w-full bg-transparent outline-none placeholder:opacity-40 transition-colors text-sm font-normal tracking-widest"
                style={{
                  color: textColor,
                  letterSpacing: '0.15em',
                }}
              />
              <motion.button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 p-1.5 rounded-lg transition-colors flex-shrink-0 hover:opacity-70"
                style={{
                  color: focusedField === 'password' ? focusColor : `${textColor}50`,
                  backgroundColor: focusedField === 'password' ? `${focusColor}15` : 'transparent'
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
        <AnimatePresence>
          {errors.password && (
            <motion.p
              className="text-xs text-red-400 flex items-center gap-1.5 px-1 mt-1"
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <span>{errors.password.message}</span>
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Remember Me & Forgot Password - Rediseñado */}
      <motion.div
        className="w-full flex items-center justify-between pt-1"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <motion.label
          className="flex items-center gap-2.5 cursor-pointer group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              {...register('rememberMe')}
              className="sr-only"
            />
            <motion.div
              className="w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 overflow-hidden"
              style={{
                borderColor: rememberMe ? primaryColor : borderColor,
                backgroundColor: rememberMe
                  ? primaryColor
                  : 'transparent',
              }}
              animate={{
                scale: rememberMe ? 1.1 : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              <AnimatePresence>
                {rememberMe && (
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 90 }}
                    transition={{ duration: 0.2, type: 'spring' }}
                  >
                    <Check className="w-3 h-3 text-white stroke-[3]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
          <span
            className="text-xs font-medium transition-colors select-none"
            style={{
              color: textColor,
              opacity: rememberMe ? 1 : 0.7
            }}
          >
            Recordarme
          </span>
        </motion.label>

        {/* Olvidaste tu contraseña */}
        <button
          type="button"
          onClick={() => router.push('/auth/forgot-password')}
          className="text-xs font-medium transition-colors hover:opacity-80"
          style={{ color: primaryColor }}
        >
          ¿Olvidaste tu contraseña?
        </button>
      </motion.div>

      {/* Submit Button - Azul sólido */}
      <motion.div
        className="pt-2"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <motion.button
          type="submit"
          disabled={isPending}
          className="w-full relative overflow-hidden group rounded-xl py-3.5 px-5 font-semibold text-sm text-white transition-all duration-300 border-0"
          style={{
            backgroundColor: primaryColor,
            boxShadow: `0 4px 14px -2px ${primaryColor}40`,
          }}
          whileHover={{
            scale: 1.01,
            boxShadow: `0 6px 20px -2px ${primaryColor}50`,
          }}
          whileTap={{ scale: 0.99 }}
        >
          {/* Button content */}
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isPending ? (
              <>
                <motion.div
                  className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <span className="text-xs">Ingresando...</span>
              </>
            ) : (
              <span>Ingresar</span>
            )}
          </span>
        </motion.button>
      </motion.div>
    </form>
      
      {/* Social Login */}
      {(googleLoginEnabled || microsoftLoginEnabled) && (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mt-6"
        >
          <SocialLoginButtons
            googleEnabled={googleLoginEnabled}
            microsoftEnabled={microsoftLoginEnabled}
            organizationSlug={organizationSlug}
            organizationId={organizationId}
            invitationToken={invitationToken || undefined}
            bulkInviteToken={bulkInviteToken || undefined}
          />
        </motion.div>
      )}
    </>
  );
}
