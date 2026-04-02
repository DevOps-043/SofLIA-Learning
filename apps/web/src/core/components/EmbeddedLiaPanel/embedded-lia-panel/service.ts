import type {
  EmbeddedLiaChatMode,
  EmbeddedLiaColors,
  EmbeddedLiaLinkToken,
  EmbeddedLiaModeOption,
  EmbeddedLiaThemeStyles,
  OrganizationColors,
} from './types';

export const DEFAULT_EMBEDDED_LIA_MODE: EmbeddedLiaChatMode = 'context';

export function getEmbeddedLiaColors(
  themeStyles: EmbeddedLiaThemeStyles | null | undefined,
  organizationColors?: OrganizationColors
): EmbeddedLiaColors {
  return {
    primary: themeStyles?.accent_color || organizationColors?.primary || '#00D4B3',
    accent: themeStyles?.secondary_button_color || organizationColors?.accent || '#6C757D',
    cardBg: themeStyles?.card_background || organizationColors?.cardBackground || '#1E2329',
    text: themeStyles?.text_color || organizationColors?.textColor || '#FFFFFF',
  };
}

export function getEmbeddedLiaNavbarHeight(pathname?: string | null): string {
  if (!pathname) {
    return '4rem';
  }

  const isDashboardPage =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/my-courses') ||
    pathname.startsWith('/courses') ||
    pathname.startsWith('/communities') ||
    pathname.startsWith('/news') ||
    pathname.startsWith('/statistics') ||
    pathname.startsWith('/questionnaire') ||
    pathname.startsWith('/account-settings') ||
    pathname.startsWith('/certificates');

  const isBusinessPage = pathname.startsWith('/business');

  return isDashboardPage || isBusinessPage ? '5rem' : '5rem';
}

export function getEmbeddedLiaModes(colors: EmbeddedLiaColors): EmbeddedLiaModeOption[] {
  return [
    {
      id: DEFAULT_EMBEDDED_LIA_MODE,
      name: 'PRL-1.0 Mini',
      description:
        'Tu asistente inteligente con contexto de pagina. Resuelve dudas, explica conceptos y te guia en tu aprendizaje.',
      color: colors.accent,
    },
  ];
}

export function tokenizeEmbeddedLiaText(text: string): EmbeddedLiaLinkToken[] {
  if (!text) {
    return [{ type: 'text', content: '' }];
  }

  const linkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
  const tokens: EmbeddedLiaLinkToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }

    tokens.push({
      type: 'link',
      content: match[1],
      href: match[2],
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', content: text.substring(lastIndex) });
  }

  return tokens.length > 0 ? tokens : [{ type: 'text', content: text }];
}
