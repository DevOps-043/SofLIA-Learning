'use client';

import { motion } from 'framer-motion';
import { AccountSettingsSaveButton } from './components/AccountSettingsSaveButton';
import {
  AccountSettingsLoading,
  AccountSettingsSaveMessage
} from './components/AccountSettingsStatus';
import { NotificationsSection } from './components/NotificationsSection';
import { PrivacySection } from './components/PrivacySection';
import { useAccountSettings } from './hooks/useAccountSettings';

export default function AccountSettingsPage() {
  const {
    handleSave,
    isLoading,
    isSaving,
    notifications,
    privacy,
    saveMessage,
    setNotifications,
    setPrivacy
  } = useAccountSettings();

  if (isLoading) {
    return <AccountSettingsLoading />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Configuracion de la cuenta
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Gestiona tu privacidad y preferencias de notificaciones
            </p>
          </div>

          <AccountSettingsSaveMessage saveMessage={saveMessage} />
          <PrivacySection privacy={privacy} setPrivacy={setPrivacy} />
          <NotificationsSection
            notifications={notifications}
            setNotifications={setNotifications}
          />
          <AccountSettingsSaveButton isSaving={isSaving} onSave={handleSave} />
        </motion.div>
      </div>
    </div>
  );
}
