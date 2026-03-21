'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { User, Mail, Phone, CheckCircle, Shield } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Button } from '@aprende-y-aplica/ui';
import { RegisterFormData } from '../../types/auth.types';
import { registerSchema } from '../RegisterForm/RegisterForm.schema';
import { PasswordInput } from '../PasswordInput';
import { CountrySelector } from '../CountrySelector';
import { registerAction } from '../../actions/register';
import { SocialLoginButtons } from '../SocialLoginButtons/SocialLoginButtons';
import Link from 'next/link';
import { ToastNotification } from '../../../../core/components/ToastNotification';
import { useThemeStore } from '../../../../core/stores/themeStore';

const LegalDocumentsModal = dynamic(() => import('../LegalDocumentsModal').then(mod => ({ default: mod.LegalDocumentsModal })), {
  ssr: false
});

interface OrganizationRegisterFormProps {
  organizationId: string;
  organizationSlug: string;
  invitationToken?: string | null;
  invitedEmail?: string | null;
  invitedRole?: string | null;
  bulkInviteToken?: string | null;
  googleLoginEnabled?: boolean;
  microsoftLoginEnabled?: boolean;
}

// Mapeo de roles para mostrar en español
const roleLabels: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  member: 'Miembro',
};

export function OrganizationRegisterForm({
  organizationId,
  organizationSlug,
  invitationToken,
  invitedEmail,
  invitedRole,
  bulkInviteToken,
  googleLoginEnabled = false,
  microsoftLoginEnabled = false,
}: OrganizationRegisterFormProps) {
  const router = useRouter();
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState('MX');
  const [dialCode, setDialCode] = useState('+52');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      countryCode: 'MX',
      phoneNumber: '',
      email: invitedEmail || '',
      confirmEmail: invitedEmail || '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : true;

  interface LoginStyles {
    primary_button_color?: string;
    secondary_button_color?: string;
    card_background?: string;
    text_color?: string;
    border_color?: string;
  }
  const [loginStyles, setLoginStyles] = useState<LoginStyles | null>(null);

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
      } catch (error) {}
    };
    if (organizationSlug) {
      fetchLoginStyles();
    }
  }, [organizationSlug]);

  const defaultCardBg = isDark ? '#1a1a2e' : 'rgba(255, 255, 255, 0.9)';
  const defaultText = isDark ? '#ffffff' : '#0f172a';
  const defaultBorder = isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(226, 232, 240, 0.8)';
  
  const textColor = loginStyles?.text_color || defaultText;
  const borderColor = loginStyles?.border_color || defaultBorder;
  const cardBg = loginStyles?.card_background || defaultCardBg;
  const themePrimaryColor = loginStyles?.primary_button_color || '#3b82f6';

  // Función auxiliar simple para hexToRgb ya que no podemos importar fácilmente
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
  };

  const inputBgColor = cardBg.startsWith('#')
    ? `rgba(${hexToRgb(cardBg)}, ${isDark ? 0.5 : 0.05})`
    : cardBg.startsWith('rgba')
      ? cardBg.replace(/rgba?\(([^)]+)\)/, (match, p1) => {
        const parts = p1.split(',');
        return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${isDark ? 0.5 : 0.05})`;
      })
      : cardBg;

  // Si hay email de invitación, establecerlo en el formulario
  useEffect(() => {
    if (invitedEmail) {
      setValue('email', invitedEmail);
      setValue('confirmEmail', invitedEmail);
    }
  }, [invitedEmail, setValue]);

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const formData = new FormData();

      // Añadir todos los campos del formulario
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          formData.append(key, value ? 'true' : 'false');
        } else {
          formData.append(key, String(value));
        }
      });

      // Agregar contexto de organización
      formData.append('organizationId', organizationId);
      formData.append('organizationSlug', organizationSlug);

      // Agregar token de invitación si existe
      if (invitationToken) {
        formData.append('invitationToken', invitationToken);
      }

      // Agregar token de invitación masiva si existe
      if (bulkInviteToken) {
        formData.append('bulkInviteToken', bulkInviteToken);
      }

      try {
        const result = await registerAction(formData);
        
        if (result?.error) {
          setError(result.error);
        } else if (result?.success) {
          setSuccess(result.message || 'Cuenta creada exitosamente');
        }
      } catch (error) {
        // console.error('Register error:', error);
        setError('Error inesperado al crear la cuenta');
      }
    });
  };

  // Redirigir al login de la organización cuando se cree exitosamente la cuenta
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        // Redirigir al login de la organización específica
        router.push(`/auth/${organizationSlug}`);
      }, 2000); // Esperar 2 segundos para que el usuario vea el mensaje de éxito

      return () => clearTimeout(timer);
    }
  }, [success, router, organizationSlug]);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {/* Header */}
        <motion.div 
          className="text-center space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <motion.h2 
            className="text-2xl lg:text-3xl font-bold"
            style={{ color: textColor }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
          >
            Crear cuenta
          </motion.h2>
          <motion.p 
            className="text-base font-normal opacity-70"
            style={{ color: textColor }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Únete a la organización
          </motion.p>
        </motion.div>

        {/* Success Message */}
        {success && (
          <motion.div 
            className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {success}
          </motion.div>
        )}

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="space-y-1.5"
          >
            <label htmlFor="firstName" className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: textColor }}>
              Nombre
            </label>
            <div className="relative group">
               <motion.div
                className="relative rounded-xl border transition-all duration-300 overflow-hidden"
                style={{
                  backgroundColor: inputBgColor,
                  borderColor: borderColor,
                  borderWidth: '1px',
                }}
              >
                <div className="flex items-center px-4 py-3">
                  <User className="w-4 h-4 flex-shrink-0 mr-3 transition-colors duration-200" style={{ color: `${textColor}50` }} />
                  <input
                    id="firstName"
                    type="text"
                    placeholder="Juan"
                    {...register('firstName')}
                    className="flex-1 w-full bg-transparent outline-none placeholder:opacity-40 transition-colors text-sm font-normal"
                    style={{ color: textColor }}
                  />
                </div>
              </motion.div>
            </div>
            {errors.firstName && (
              <p className="auth-error">{errors.firstName.message}</p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="space-y-1.5"
          >
            <label htmlFor="lastName" className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: textColor }}>
              Apellido
            </label>
             <div className="relative group">
               <motion.div
                className="relative rounded-xl border transition-all duration-300 overflow-hidden"
                style={{
                  backgroundColor: inputBgColor,
                  borderColor: borderColor,
                  borderWidth: '1px',
                }}
              >
                <div className="flex items-center px-4 py-3">
                  <User className="w-4 h-4 flex-shrink-0 mr-3 transition-colors duration-200" style={{ color: `${textColor}50` }} />
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Pérez"
                    {...register('lastName')}
                    className="flex-1 w-full bg-transparent outline-none placeholder:opacity-40 transition-colors text-sm font-normal"
                    style={{ color: textColor }}
                  />
                </div>
              </motion.div>
            </div>
            {errors.lastName && (
              <p className="auth-error">{errors.lastName.message}</p>
            )}
          </motion.div>
        </div>

        {/* Username */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-1.5"
        >
          <label htmlFor="username" className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: textColor }}>
            Usuario
          </label>
           <div className="relative group">
               <motion.div
                className="relative rounded-xl border transition-all duration-300 overflow-hidden"
                style={{
                  backgroundColor: inputBgColor,
                  borderColor: borderColor,
                  borderWidth: '1px',
                }}
              >
                 <div className="flex items-center px-4 py-3">
                  <input
                    id="username"
                    type="text"
                    placeholder="juanperez"
                    {...register('username')}
                    className="flex-1 w-full bg-transparent outline-none placeholder:opacity-40 transition-colors text-sm font-normal"
                    style={{ color: textColor }}
                  />
                </div>
              </motion.div>
          </div>
          {errors.username && (
            <p className="auth-error">{errors.username.message}</p>
          )}
        </motion.div>

        {/* Rol asignado por invitación */}
        {invitedRole && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Serás registrado como: <strong>{roleLabels[invitedRole] || invitedRole}</strong>
                  {bulkInviteToken && <span className="ml-1 text-xs opacity-70">(vía enlace de invitación)</span>}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Email Fields */}
        <div className={`grid grid-cols-1 ${invitedEmail ? '' : 'md:grid-cols-2'} gap-4`}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-1.5"
          >
            <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: textColor }}>
              Correo Electrónico
            </label>
            <div className="relative group">
                <motion.div
                className="relative rounded-xl border transition-all duration-300 overflow-hidden"
                style={{
                  backgroundColor: invitedEmail ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') : inputBgColor,
                  borderColor: borderColor,
                  borderWidth: '1px',
                }}
              >
                <div className="flex items-center px-4 py-3">
                  <Mail className="w-4 h-4 flex-shrink-0 mr-3 transition-colors duration-200" style={{ color: `${textColor}50` }} />
                  <input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    {...register('email')}
                    disabled={!!invitedEmail}
                    readOnly={!!invitedEmail}
                    onPaste={(e) => !invitedEmail && e.preventDefault()}
                    className={`flex-1 w-full bg-transparent outline-none placeholder:opacity-40 transition-colors text-sm font-normal ${
                      invitedEmail ? 'cursor-not-allowed opacity-60' : ''
                    }`}
                    style={{ color: textColor }}
                  />
                  {invitedEmail && (
                    <div className="flex items-center gap-1 ml-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
            {errors.email && (
              <p className="auth-error">{errors.email.message}</p>
            )}
            {invitedEmail && (
              <p className="text-xs mt-1" style={{ color: `${textColor}60` }}>
                Este email está asociado a tu invitación
              </p>
            )}
          </motion.div>

          {/* Solo mostrar confirmar email si NO hay invitación */}
          {!invitedEmail && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="space-y-1.5"
            >
              <label htmlFor="confirmEmail" className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: textColor }}>
                Confirmar Correo
              </label>
              <div className="relative group">
                 <motion.div
                  className="relative rounded-xl border transition-all duration-300 overflow-hidden"
                  style={{
                    backgroundColor: inputBgColor,
                    borderColor: borderColor,
                    borderWidth: '1px',
                  }}
                >
                  <div className="flex items-center px-4 py-3">
                    <Mail className="w-4 h-4 flex-shrink-0 mr-3 transition-colors duration-200" style={{ color: `${textColor}50` }} />
                    <input
                      id="confirmEmail"
                      type="email"
                      placeholder="tu@email.com"
                      {...register('confirmEmail')}
                      onPaste={(e) => e.preventDefault()}
                      className="flex-1 w-full bg-transparent outline-none placeholder:opacity-40 transition-colors text-sm font-normal"
                      style={{ color: textColor }}
                    />
                  </div>
                </motion.div>
              </div>
              {errors.confirmEmail && (
                <p className="auth-error">{errors.confirmEmail.message}</p>
              )}
            </motion.div>
          )}
        </div>

        {/* Phone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="space-y-1.5"
        >
          <label htmlFor="phoneNumber" className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: textColor }}>
            Teléfono
          </label>
          <div className="flex gap-2">
            <CountrySelector
              selectedCountryCode={selectedCountryCode}
              dialCode={dialCode}
              onCountryChange={(code, dial) => {
                setSelectedCountryCode(code);
                setDialCode(dial);
                setValue('countryCode', code);
              }}
              customStyles={{
                bgColor: inputBgColor,
                borderColor: borderColor,
                textColor: textColor
              }}
            />
            <div className="relative flex-1 group">
               <motion.div
                className="relative rounded-xl border transition-all duration-300 overflow-hidden"
                style={{
                  backgroundColor: inputBgColor,
                  borderColor: borderColor,
                  borderWidth: '1px',
                }}
              >
                <div className="flex items-center px-4 py-3">
                   <Phone className="w-4 h-4 flex-shrink-0 mr-3 transition-colors duration-200" style={{ color: `${textColor}50` }} />
                  <input
                    id="phoneNumber"
                    type="tel"
                    placeholder="1234567890"
                    {...register('phoneNumber')}
                    className="flex-1 w-full bg-transparent outline-none placeholder:opacity-40 transition-colors text-sm font-normal"
                    style={{ color: textColor }}
                  />
                </div>
              </motion.div>
            </div>
          </div>
          {errors.phoneNumber && (
            <p className="auth-error">{errors.phoneNumber.message}</p>
          )}
        </motion.div>

        {/* Password Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="space-y-1.5"
          >
            <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: textColor }}>
              Contraseña
            </label>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              error={errors.password?.message}
              customColors={{
                bgColor: inputBgColor,
                borderColor: borderColor,
                textColor: textColor
              }}
              {...register('password')}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="space-y-1.5"
          >
            <label htmlFor="confirmPassword" className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: textColor }}>
              Confirmar Contraseña
            </label>
            <PasswordInput
              id="confirmPassword"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              customColors={{
                bgColor: inputBgColor,
                borderColor: borderColor,
                textColor: textColor
              }}
              {...register('confirmPassword')}
            />
          </motion.div>
        </div>

        {/* Terms and Conditions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="flex items-start gap-3"
        >
          <input
            id="acceptTerms"
            type="checkbox"
            {...register('acceptTerms')}
            className="auth-checkbox mt-1"
          />
          <label htmlFor="acceptTerms" className="text-sm cursor-pointer" style={{ color: textColor }}>
            Acepto los{' '}
            <button
              type="button"
              onClick={() => setShowLegalModal(true)}
              className="font-semibold hover:underline transition-all"
              style={{ color: '#60a5fa' }}
            >
              términos y condiciones
            </button>
            {' '}y la{' '}
            <button
              type="button"
              onClick={() => setShowLegalModal(true)}
              className="font-semibold hover:underline transition-all"
              style={{ color: '#60a5fa' }}
            >
              política de privacidad
            </button>
          </label>
        </motion.div>
        {errors.acceptTerms && (
          <p className="auth-error">{errors.acceptTerms.message}</p>
        )}

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="pt-2"
        >
          <motion.button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl py-3 font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              backgroundColor: themePrimaryColor || '#3b82f6',
              boxShadow: `0 4px 20px -4px ${themePrimaryColor || '#3b82f6'}50`,
            }}
            whileHover={{ 
              scale: 1.02,
              boxShadow: `0 8px 30px -4px ${themePrimaryColor || '#3b82f6'}60`,
            }}
            whileTap={{ scale: 0.98 }}
          >
            {isPending ? (
              <>
                <motion.div
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <span>Creando cuenta...</span>
              </>
            ) : (
              <span>Crear cuenta</span>
            )}
          </motion.button>
        </motion.div>

        {/* Social Login Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
        >
          <SocialLoginButtons
            googleEnabled={googleLoginEnabled}
            microsoftEnabled={microsoftLoginEnabled}
            organizationSlug={organizationSlug}
            organizationId={organizationId}
            invitationToken={invitationToken || undefined}
            bulkInviteToken={bulkInviteToken || undefined}
            showLoginLink={true}
          />
        </motion.div>


      </form>

      {/* Legal Documents Modal */}
      <LegalDocumentsModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
      />

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

