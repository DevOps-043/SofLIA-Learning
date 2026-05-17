import { useEffect, useState } from 'react';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import type { NotificationSettings, PrivacySettings, SaveMessage } from '../types';

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  communityUpdates: false,
  courseUpdates: true,
  email: true,
  marketing: false,
  push: true
};

const DEFAULT_PRIVACY: PrivacySettings = {
  profileVisibility: 'public',
  showActivity: true,
  showEmail: false
};

export function useAccountSettings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<SaveMessage | null>(null);
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [privacy, setPrivacy] = useState(DEFAULT_PRIVACY);

  useEffect(() => {
    async function loadSettings() {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const response = await fetch('/api/account-settings');
        if (!response.ok) return;
        const data = await response.json();
        if (data.privacy) {
          setPrivacy({
            profileVisibility: data.privacy.profileVisibility || 'public',
            showActivity: data.privacy.showActivity !== undefined ? data.privacy.showActivity : true,
            showEmail: data.privacy.showEmail || false
          });
        }
        if (data.notifications) setNotifications(data.notifications);
      } finally {
        setIsLoading(false);
      }
    }

    void loadSettings();
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setIsSaving(true);
      setSaveMessage(null);
      const response = await fetch('/api/account-settings', {
        body: JSON.stringify({ notifications, privacy }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        showMessage({ type: 'error', text: error.error || 'Error al guardar la configuracion' }, 5000);
        return;
      }

      showMessage({ type: 'success', text: 'Configuracion guardada exitosamente' }, 3000);
    } catch {
      showMessage({ type: 'error', text: 'Error al guardar la configuracion' }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const showMessage = (message: SaveMessage, timeout: number) => {
    setSaveMessage(message);
    setTimeout(() => setSaveMessage(null), timeout);
  };

  return {
    handleSave,
    isLoading,
    isSaving,
    notifications,
    privacy,
    saveMessage,
    setNotifications,
    setPrivacy
  };
}
