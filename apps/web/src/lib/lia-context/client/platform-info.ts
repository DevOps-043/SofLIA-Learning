import type { LiaEnrichedMetadata } from './lia-context.types';

type PlatformInfo = LiaEnrichedMetadata['platform'];

export function detectPlatformInfo(): PlatformInfo {
  if (typeof window === 'undefined') {
    return {
      browser: 'unknown',
      language: 'en',
      os: 'unknown',
      screenResolution: '0x0',
      timezone: 'UTC',
      version: 'unknown',
    };
  }

  const userAgent = navigator.userAgent;

  return {
    browser: detectBrowser(userAgent).browser,
    language: navigator.language,
    os: detectOperatingSystem(userAgent),
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    version: detectBrowser(userAgent).version,
  };
}

function detectBrowser(userAgent: string): { browser: string; version: string } {
  if (userAgent.includes('Firefox/')) {
    return { browser: 'Firefox', version: userAgent.match(/Firefox\/(\d+)/)?.[1] || '' };
  }

  if (userAgent.includes('Chrome/')) {
    return { browser: 'Chrome', version: userAgent.match(/Chrome\/(\d+)/)?.[1] || '' };
  }

  if (userAgent.includes('Safari/') && !userAgent.includes('Chrome')) {
    return { browser: 'Safari', version: userAgent.match(/Version\/(\d+)/)?.[1] || '' };
  }

  if (userAgent.includes('Edge/')) {
    return { browser: 'Edge', version: userAgent.match(/Edge\/(\d+)/)?.[1] || '' };
  }

  return { browser: 'Unknown', version: '' };
}

function detectOperatingSystem(userAgent: string): string {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    return 'iOS';
  }

  return 'Unknown';
}
