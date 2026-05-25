import { motion } from 'framer-motion';
import { Mail, User } from 'lucide-react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { RegisterFormData } from '../../types/auth.types';
import { TextInput } from '../TextInput';

type Translate = (key: string) => string;

interface RegisterAccountFieldsProps {
  t: Translate;
  errors: FieldErrors<RegisterFormData>;
  register: UseFormRegister<RegisterFormData>;
}

export function RegisterAccountFields({ t, errors, register }: RegisterAccountFieldsProps) {
  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
        <TextInput
          id="username"
          label={t('auth.register.usernameLabel')}
          placeholder={t('auth.register.usernamePlaceholder')}
          icon={User}
          error={errors.username?.message}
          {...register('username')}
        />
      </motion.div>
      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35, duration: 0.4 }}>
          <TextInput
            id="email"
            label={t('auth.register.emailLabel')}
            placeholder={t('auth.register.emailPlaceholder')}
            icon={Mail}
            error={errors.email?.message}
            type="email"
            onPaste={(event) => event.preventDefault()}
            {...register('email')}
          />
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.4 }}>
          <TextInput
            id="confirmEmail"
            label={t('auth.register.confirmEmailLabel')}
            placeholder={t('auth.register.emailPlaceholder')}
            icon={Mail}
            error={errors.confirmEmail?.message}
            type="email"
            onPaste={(event) => event.preventDefault()}
            {...register('confirmEmail')}
          />
        </motion.div>
      </div>
    </>
  );
}
