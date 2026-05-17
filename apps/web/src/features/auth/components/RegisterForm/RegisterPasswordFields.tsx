import { motion } from 'framer-motion';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { RegisterFormData } from '../../types/auth.types';
import { PasswordInput } from '../PasswordInput';

type Translate = (key: string) => string;

interface RegisterPasswordFieldsProps {
  t: Translate;
  errors: FieldErrors<RegisterFormData>;
  register: UseFormRegister<RegisterFormData>;
}

export function RegisterPasswordFields({ t, errors, register }: RegisterPasswordFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, duration: 0.4 }}>
        <label className="block text-sm font-medium mb-2 text-[#0A2540] dark:text-white/90">
          {t('auth.register.passwordLabel')}
        </label>
        <PasswordInput
          id="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
      </motion.div>
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55, duration: 0.4 }}>
        <label className="block text-sm font-medium mb-2 text-[#0A2540] dark:text-white/90">
          {t('auth.register.confirmPasswordLabel')}
        </label>
        <PasswordInput
          id="confirmPassword"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
      </motion.div>
    </div>
  );
}
