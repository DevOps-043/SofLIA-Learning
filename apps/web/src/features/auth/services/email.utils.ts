export interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

type EnvSource = Record<string, string | undefined>;

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function getEmailConfig(env: EnvSource = process.env): EmailConfig {
  const port = Number.parseInt(env.SMTP_PORT || '587', 10);

  return {
    host: env.SMTP_SERVER || env.SMTP_HOST || '',
    port: Number.isFinite(port) ? port : 587,
    user: env.SMTP_USERNAME || env.SMTP_USER || '',
    pass: env.SMTP_PASSWORD || env.SMTP_PASS || '',
  };
}

export function isEmailConfigValid(config: EmailConfig): boolean {
  return Boolean(config.host && config.user && config.pass);
}

export function getEmailAppUrl(env: EnvSource = process.env): string {
  return env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export function ensureAbsoluteUrl(
  url: string | undefined,
  appUrl: string
): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  return `${appUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function getSofliaLogoUrl(appUrl: string): string {
  const isLocalhost =
    appUrl.includes('localhost') || appUrl.includes('127.0.0.1');

  return isLocalhost
    ? 'https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/logo.png'
    : `${appUrl}/Logo.png`;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPE_MAP[character]);
}
