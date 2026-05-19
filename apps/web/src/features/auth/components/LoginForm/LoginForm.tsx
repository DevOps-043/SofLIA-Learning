'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Loader2, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LoginFormData } from '../../types/auth.types';
import { getLoginSchema } from './LoginForm.schema';
import { loginAction } from '../../actions/login';
import { getSavedCredentials, saveCredentials, clearSavedCredentials } from '../../../../lib/auth/remember-me';
import { ToastNotification } from '../../../../core/components/ToastNotification';
import { TextInput } from '../TextInput';
import { PasswordInput } from '../PasswordInput';
import { SocialLoginButtons } from '../SocialLoginButtons';
import { HumanVerificationField } from '../HumanVerificationField';
import Link from 'next/link';
import { useAuthTab } from '../AuthTabs/AuthTabContext';
import { clearAuthUserCache } from '../../../../lib/auth/user-auth-cache';
import { verifyMfaLoginChallenge } from '../../services/mfa-login-client.service';
import { MfaChallengeForm } from './MfaChallengeForm';

function hasRedirectTarget(
  result: Awaited<ReturnType<typeof loginAction>> | null | undefined
): boolean {
  return (
    typeof result === 'object' &&
    result !== null &&
    'redirectTo' in result &&
    typeof result.redirectTo === 'string'
  );
}

function isSuccessfulLoginResult(
  result: Awaited<ReturnType<typeof loginAction>> | null | undefined
): result is { success: true; redirectTo: string } {
  return (
    typeof result === 'object' &&
    result !== null &&
    'success' in result &&
    result.success === true &&
    hasRedirectTarget(result)
  );
}

function isMfaRequiredResult(
  result: Awaited<ReturnType<typeof loginAction>> | null | undefined
): result is { challengeToken: string; requiresMfa: true } {
  return (
    typeof result === 'object' &&
    result !== null &&
    'requiresMfa' in result &&
    result.requiresMfa === true &&
    'challengeToken' in result &&
    typeof result.challengeToken === 'string'
  );
}

function getLoginResultError(
  result: Awaited<ReturnType<typeof loginAction>> | null | undefined
) {
  return (
    typeof result === 'object' &&
    result !== null &&
    'error' in result &&
    typeof result.error === 'string'
  )
    ? result.error
    : null;
}

function getObjectErrorMessage(error: unknown) {
  return (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  )
    ? error.message
    : null;
}

export function LoginForm() {
  const { t } = useTranslation('common');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState('');
  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaCredentials, setMfaCredentials] = useState<LoginFormData | null>(null);
  const submitInFlightRef = useRef(false);
  const { setActiveTab } = useAuthTab();

  const loginSchema = React.useMemo(() => getLoginSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors },
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

  const rememberMe = watch('rememberMe');

  const persistCredentialsPreference = (data: LoginFormData) => {
    if (data.rememberMe) {
      saveCredentials({
        emailOrUsername: data.emailOrUsername,
        password: data.password,
      });
      return;
    }

    clearSavedCredentials();
  };

  // Cargar credenciales guardadas al montar el componente
  useEffect(() => {
    const savedCredentials = getSavedCredentials();
    if (savedCredentials) {
      setValue('emailOrUsername', savedCredentials.emailOrUsername);
      if (savedCredentials.password) {
        setValue('password', savedCredentials.password);
      }
      setValue('rememberMe', true);
    }
  }, [setValue]);

  const onSubmit = async (data: LoginFormData) => {
    if (submitInFlightRef.current) {
      return;
    }

    submitInFlightRef.current = true;
    setError(null);
    setIsPending(true);

    const finishPending = () => {
      submitInFlightRef.current = false;
      setIsPending(false);
    };

    try {
      clearAuthUserCache();

      const formData = new FormData();
      formData.append('emailOrUsername', data.emailOrUsername);
      formData.append('password', data.password);
      formData.append('rememberMe', data.rememberMe.toString());
      formData.append('captchaToken', captchaToken);

      const result = await loginAction(formData);

      const resultError = getLoginResultError(result);
      if (resultError) {
        setError(resultError);
        finishPending();
        return;
      } else if (isSuccessfulLoginResult(result)) {
        persistCredentialsPreference(data);
        // ✅ Login exitoso - navegar a la URL indicada
        // IMPORTANTE: Usar window.location.href en lugar de router.push
        // para forzar navegación completa y que las cookies del servidor se propaguen
        window.location.href = result.redirectTo;
        // No resetear isPending - la página recargará completamente
        return;
      } else if (isMfaRequiredResult(result)) {
        setMfaChallengeToken(result.challengeToken);
        setMfaCredentials(data);
        setMfaCode('');
        finishPending();
        return;
      }
      finishPending();
    } catch (error: unknown) {
      // Verificar si es una redirección de Next.js (no es un error real)
      if (error && typeof error === 'object') {
        // Next.js redirect lanza un error especial que debemos re-lanzar
        if ('digest' in error) {
          const digest = error.digest;
          if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
            // Es una redirección exitosa, re-lanzar para que Next.js la maneje
            submitInFlightRef.current = false;
            throw error;
          }
        }

        // También puede ser un error de redirección de otra forma
        const message = getObjectErrorMessage(error);
        if (message?.includes('NEXT_REDIRECT')) {
          submitInFlightRef.current = false;
          throw error;
        }
      }

      // Proporcionar mensaje de error más específico
      let errorMessage = t('auth.login.errors.unexpected');

      if (error instanceof Error) {
        // Errores de red/conexión
        if (error.message.includes('ERR_SSL_PROTOCOL_ERROR') ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError')) {
          errorMessage = t('auth.login.errors.connection');
        } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
          errorMessage = t('auth.login.errors.timeout');
        } else {
          errorMessage = error.message || errorMessage;
        }
      }

      setError(errorMessage);
      finishPending();
    }
  };

  const onMfaSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!mfaChallengeToken || submitInFlightRef.current) {
      return;
    }

    submitInFlightRef.current = true;
    setError(null);
    setIsPending(true);

    try {
      const result = await verifyMfaLoginChallenge({
        challengeToken: mfaChallengeToken,
        fallbackError: t('auth.login.mfa.errors.verifyFailed'),
        token: mfaCode,
      });

      if (!result.verified) {
        setError(result.error);
        submitInFlightRef.current = false;
        setIsPending(false);
        return;
      }

      if (mfaCredentials) {
        persistCredentialsPreference(mfaCredentials);
      }

      window.location.href = result.redirectTo;
    } catch {
      setError(t('auth.login.mfa.errors.verifyFailed'));
      submitInFlightRef.current = false;
      setIsPending(false);
    }
  };

  const resetMfaChallenge = () => {
    setMfaChallengeToken(null);
    setMfaCredentials(null);
    setMfaCode('');
    setError(null);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        {/* Tarjeta principal con bordes redondeados */}
        <div className="bg-white dark:bg-[#1E2329] rounded-2xl shadow-xl dark:shadow-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-8 sm:p-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-[#0A2540] dark:text-white mb-2">
              {t('auth.login.title')}
            </h1>
            <p className="text-sm sm:text-base text-[#6C757D] dark:text-white/60">
              {t('auth.login.subtitle')}
            </p>
          </motion.div>

          {mfaChallengeToken ? (
            <MfaChallengeForm
              code={mfaCode}
              isPending={isPending}
              onBack={resetMfaChallenge}
              onCodeChange={setMfaCode}
              onSubmit={onMfaSubmit}
              t={t}
            />
          ) : (
            <>
          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Campo Email/Usuario */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <TextInput
                id="emailOrUsername"
                label={t('auth.login.emailOrUsernameLabel')}
                placeholder={t('auth.login.emailOrUsernamePlaceholder')}
                icon={Mail}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                disabled={isPending}
                error={errors.emailOrUsername?.message}
                focusedField={focusedField}
                onFocus={() => setFocusedField('emailOrUsername')}
                {...register('emailOrUsername')}
              />
            </motion.div>

            {/* Campo Contraseña */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <PasswordInput
                id="password"
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isPending}
                error={errors.password?.message}
                focusedField={focusedField}
                onFocus={() => setFocusedField('password')}
                {...register('password')}
              />
            </motion.div>

            {/* Recordar y Olvidaste tu contraseña */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="w-full flex items-center justify-between"
            >
              {/* Checkbox Recordar */}
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="sr-only"
                />
                <motion.div
                  className={`relative w-5 h-5 rounded-lg border-2 transition-all duration-200 ${rememberMe
                    ? 'bg-[#00D4B3] border-[#00D4B3]'
                    : 'bg-white dark:bg-[#1E2329] border-[#6C757D] dark:border-[#6C757D]/50'
                    }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <AnimatePresence>
                    {rememberMe && (
                      <motion.svg
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 w-full h-full text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </motion.div>
                <span className="ml-2.5 text-sm font-medium text-[#0A2540] dark:text-white/80 group-hover:text-[#00D4B3] transition-colors">
                  {t('auth.login.rememberMe')}
                </span>
              </label>

              {/* Olvidaste tu contraseña */}
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-[#00D4B3] hover:text-[#00D4B3]/80 dark:text-[#00D4B3] dark:hover:text-[#00D4B3]/70 transition-colors"
              >
                {t('auth.login.forgotPassword')}
              </Link>
            </motion.div>

            <HumanVerificationField onTokenChange={setCaptchaToken} />

            {/* Botón de Login */}
            <motion.button
              type="submit"
              disabled={isPending}
              aria-disabled={isPending}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-[#0A2540] dark:bg-[#0A2540] hover:bg-[#0d2f4d] dark:hover:bg-[#0d2f4d] text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t('auth.login.signingIn')}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>{t('auth.login.signIn')}</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Divisor y Social Login */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="mt-6"
          >
            <SocialLoginButtons />
          </motion.div>

          {/* Link a Registro */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-[#6C757D] dark:text-white/60">
              {t('auth.login.noAccount')}{' '}
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                className="font-semibold text-[#00D4B3] hover:text-[#00D4B3]/80 dark:text-[#00D4B3] dark:hover:text-[#00D4B3]/70 transition-colors"
              >
                {t('auth.login.registerHere')}
              </button>
            </p>
          </motion.div>
            </>
          )}
        </div>
      </motion.div>

      {/* Toast Notification para errores */}
      <ToastNotification
        isOpen={!!error}
        onClose={() => setError(null)}
        message={error || ''}
        type="error"
        duration={6000}
      />
    </>
  );
}
