import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { RegisterFormData } from '../../types/auth.types';
import { TextInput } from '../TextInput';

type Translate = (key: string) => string;

interface RegisterNameFieldsProps {
  t: Translate;
  errors: FieldErrors<RegisterFormData>;
  register: UseFormRegister<RegisterFormData>;
}

export function RegisterNameFields({ t, errors, register }: RegisterNameFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.4 }}>
        <TextInput
          id="firstName"
          label={t('auth.register.firstNameLabel')}
          placeholder={t('auth.register.firstNamePlaceholder')}
          icon={User}
          error={errors.firstName?.message}
          {...register('firstName')}
        />
      </motion.div>
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25, duration: 0.4 }}>
        <TextInput
          id="lastName"
          label={t('auth.register.lastNameLabel')}
          placeholder={t('auth.register.lastNamePlaceholder')}
          icon={User}
          error={errors.lastName?.message}
          {...register('lastName')}
        />
      </motion.div>
    </div>
  );
}
