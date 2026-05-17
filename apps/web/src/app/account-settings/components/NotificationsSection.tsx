import type React from 'react';
import { Bell } from 'lucide-react';
import { SettingToggle } from './SettingToggle';
import { SettingsSection } from './SettingsSection';
import type { NotificationSettings } from '../types';

interface NotificationsSectionProps {
  notifications: NotificationSettings;
  setNotifications: React.Dispatch<React.SetStateAction<NotificationSettings>>;
}

export function NotificationsSection({
  notifications,
  setNotifications
}: NotificationsSectionProps) {
  const updateNotification = (key: keyof NotificationSettings, value: boolean) => {
    setNotifications((current) => ({ ...current, [key]: value }));
  };

  return (
    <SettingsSection delay={0.2} icon={Bell} title="Notificaciones">
      <SettingToggle
        checked={notifications.email}
        description="Recibe notificaciones importantes por correo electronico"
        label="Notificaciones por email"
        onChange={(value) => updateNotification('email', value)}
      />
      <SettingToggle
        checked={notifications.push}
        description="Recibe notificaciones en tiempo real en tu dispositivo"
        label="Notificaciones push"
        onChange={(value) => updateNotification('push', value)}
      />
      <SettingToggle
        checked={notifications.marketing}
        description="Recibe ofertas especiales y novedades"
        label="Email de marketing"
        onChange={(value) => updateNotification('marketing', value)}
      />
      <SettingToggle
        checked={notifications.courseUpdates}
        description="Notificaciones cuando tus cursos se actualicen"
        label="Actualizaciones de cursos"
        onChange={(value) => updateNotification('courseUpdates', value)}
      />
      <SettingToggle
        checked={notifications.communityUpdates}
        description="Notificaciones sobre actividades en tus comunidades"
        label="Actualizaciones de comunidad"
        onChange={(value) => updateNotification('communityUpdates', value)}
      />
    </SettingsSection>
  );
}
