import type React from 'react';
import { Shield } from 'lucide-react';
import { SettingToggle } from './SettingToggle';
import { SettingsSection } from './SettingsSection';
import type { PrivacySettings } from '../types';

interface PrivacySectionProps {
  privacy: PrivacySettings;
  setPrivacy: React.Dispatch<React.SetStateAction<PrivacySettings>>;
}

export function PrivacySection({ privacy, setPrivacy }: PrivacySectionProps) {
  return (
    <SettingsSection delay={0.1} icon={Shield} title="Privacidad">
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Visibilidad del perfil
        </label>
        <select
          value={privacy.profileVisibility}
          onChange={(event) => setPrivacy({ ...privacy, profileVisibility: event.target.value })}
          className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50"
        >
          <option value="public">Publico</option>
          <option value="self">Yo</option>
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {privacy.profileVisibility === 'public'
            ? 'Tu perfil sera visible para todos los miembros de la comunidad'
            : 'Solo tu podras ver la informacion completa de tu perfil'}
        </p>
      </div>
      <SettingToggle
        checked={privacy.showEmail}
        description="Permite que otros usuarios vean tu email"
        label="Mostrar email en perfil"
        onChange={(showEmail) => setPrivacy({ ...privacy, showEmail })}
      />
      <SettingToggle
        checked={privacy.showActivity}
        description="Muestra tu actividad reciente en tu perfil"
        label="Mostrar actividad"
        onChange={(showActivity) => setPrivacy({ ...privacy, showActivity })}
      />
    </SettingsSection>
  );
}
