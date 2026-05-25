export interface NotificationSettings {
  email: boolean;
  push: boolean;
  marketing: boolean;
  courseUpdates: boolean;
  communityUpdates: boolean;
}

export interface PrivacySettings {
  profileVisibility: string;
  showEmail: boolean;
  showActivity: boolean;
}

export interface SaveMessage {
  type: 'success' | 'error';
  text: string;
}
