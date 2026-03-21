'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { resetPasswordAction, validateResetTokenAction } from '../../actions/reset-password';
import { resetPasswordSchema, type ResetPasswordFormData } from './ResetPasswordForm.schema';
import { Loader2, Lock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { PasswordInput } from '../PasswordInput';
import Link from 'next/link';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const newPassword = watch('newPassword', '');

  // Validar token al cargar
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenError('Token no proporcionado');
        setIsValidatingToken(false);
        return;
      }

      const result = await validateResetTokenAction(token);

      if (result.valid) {
        setTokenValid(true);
      } else {
        setTokenError(result.error || 'Token inválido');
      }

      setIsValidatingToken(false);
    };

    validateToken();
  }, [token]);

  // Calcular fortaleza de contraseña
  const getPasswordStrength = () => {
    if (!newPassword) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[a-z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;

    const labels = ['', 'Débil', 'Media', 'Buena', 'Fuerte'];
    const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-[#00D4B3]'];

    return {
      strength,
      label: labels[strength],
      color: colors[strength],
    };
  };

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    setIsLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('token', token);
      formData.append('newPassword', data.newPassword);

      const response = await resetPasswordAction(formData);

      if (response.error) {
        setResult({ type: 'error', message: response.error });
      } else {
        setResult({
          type: 'success',
          message: response.message || 'Contraseña actualizada correctamente',
        });

        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          router.push('/auth?message=password-reset-success');
        }, 2000);
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: 'Error de conexión. Inténtalo más tarde.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength();

  // ESTADO: Validando token
  if (isValidatingToken) {
    return (
      <div className="w-full max-w-md mx-auto p-12 text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-[#00D4B3]" />
        <p className="text-[#6C757D] dark:text-white/60 font-medium">Verificando enlace...</p>
      </div>
    );
  }

  // ESTADO: Token inválido
  if (!tokenValid) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full"
      >
        <div className="bg-white dark:bg-[#1E2329] rounded-2xl shadow-xl dark:shadow-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-8 sm:p-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center text-red-500">
              <XCircle className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#0A2540] dark:text-white mb-3">Enlace Inválido</h1>
          <p className="text-[#6C757D] dark:text-white/60 mb-8">{tokenError}</p>
          <button
            onClick={() => router.push('/auth/forgot-password')}
            className="w-full px-6 py-3.5 rounded-xl bg-[#0A2540] hover:bg-[#0d2f4d] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Solicitar nuevo enlace
          </button>
        </div>
      </motion.div>
    );
  }

  // ESTADO: Formulario principal
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-white via-[#F8F9FA] to-white dark:from-[#0F1419] dark:via-[#0A0D12] dark:to-[#0F1419]">
      {/* Fondo animado con formas geométricas (Consistent with Auth Page) */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-[#00D4B3]/5 dark:bg-[#00D4B3]/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-[#0A2540]/5 dark:bg-[#0A2540]/10 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, -60, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
        <div 
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03] bg-[linear-gradient(#0A2540_1px,transparent_1px),linear-gradient(90deg,#0A2540_1px,transparent_1px)] bg-[length:50px_50px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg z-10"
      >
        <div className="bg-white/80 dark:bg-[#1E2329]/90 backdrop-blur-xl rounded-2xl shadow-xl dark:shadow-2xl border border-[#E9ECEF] dark:border-[#6C757D]/30 p-8 sm:p-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-6">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 rounded-full flex items-center justify-center text-[#00D4B3]"
            >
              <Lock className="w-8 h-8" />
            </motion.div>
          </div>
          <h1 className="text-3xl font-bold text-[#0A2540] dark:text-white mb-3">Nueva Contraseña</h1>
          <p className="text-sm sm:text-base text-[#6C757D] dark:text-white/60">
            Crea una contraseña segura para proteger tu cuenta.
          </p>
        </motion.div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nueva Contraseña */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[#0A2540] dark:text-white/90">
              Nueva contraseña
            </label>
            <PasswordInput
              id="newPassword"
              placeholder="Mínimo 8 caracteres"
              error={errors.newPassword?.message}
              focusedField={focusedField}
              onFocus={() => setFocusedField('newPassword')}
              {...register('newPassword')}
            />

            {/* Indicador de fortaleza */}
            <AnimatePresence>
              {newPassword && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 mt-2"
                >
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                          level <= passwordStrength.strength
                            ? passwordStrength.color
                            : 'bg-[#E9ECEF] dark:bg-[#6C757D]/20'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-medium text-[#6C757D] dark:text-white/60">
                    Fortaleza: <span className={passwordStrength.strength > 2 ? 'text-[#00D4B3]' : ''}>{passwordStrength.label}</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Requisitos */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
              {[
                { label: '8+ caracteres', test: newPassword.length >= 8 },
                { label: 'Mayúscula', test: /[A-Z]/.test(newPassword) },
                { label: 'Minúscula', test: /[a-z]/.test(newPassword) },
                { label: 'Un número', test: /[0-9]/.test(newPassword) },
              ].map((req, i) => (
                <div key={i} className={`flex items-center gap-2 text-xs font-medium transition-colors ${req.test ? 'text-[#00D4B3]' : 'text-[#6C757D] dark:text-white/40'}`}>
                  <CheckCircle className={`w-3 h-3 ${req.test ? 'opacity-100' : 'opacity-30'}`} />
                  <span>{req.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmar Contraseña */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[#0A2540] dark:text-white/90">
              Confirmar contraseña
            </label>
            <PasswordInput
              id="confirmPassword"
              placeholder="Repite tu contraseña"
              error={errors.confirmPassword?.message}
              focusedField={focusedField}
              onFocus={() => setFocusedField('confirmPassword')}
              {...register('confirmPassword')}
            />
          </div>

          {/* Mensaje de resultado */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  result.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30 text-green-800 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/30 text-red-800 dark:text-red-400'
                }`}
              >
                {result.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <p className="text-sm font-medium">{result.message}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botón Submit */}
          <motion.button
            type="submit"
            disabled={isLoading || result?.type === 'success'}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-[#0A2540] hover:bg-[#0d2f4d] text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Actualizando...</span>
              </>
            ) : (
              <span>Actualizar Contraseña</span>
            )}
          </motion.button>
          
          <div className="text-center pt-2">
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#6C757D] hover:text-[#00D4B3] dark:text-white/60 dark:hover:text-[#00D4B3] transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Volver al inicio de sesión</span>
            </Link>
          </div>
        </form>
        </div>
      </motion.div>
    </div>
  );
}
