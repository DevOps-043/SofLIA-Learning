import React from 'react';

export function detectContextFromURL(pathname: string): string {
  if (pathname.includes('/communities')) return 'communities';
  if (pathname.includes('/courses')) return 'courses';
  if (pathname.includes('/workshops')) return 'workshops';
  if (pathname.includes('/news')) return 'news';
  if (pathname.includes('/dashboard')) return 'dashboard';
  if (pathname.includes('/prompt-directory')) return 'prompts';
  if (pathname.includes('/business-panel')) return 'business';
  if (pathname.includes('/profile')) return 'profile';
  return 'general';
}

export function getPageContextInfo(pathname: string): string {
  const contextMap: Record<string, string> = {
    '/communities': 'página de comunidades - donde los usuarios pueden unirse y participar en grupos',
    '/courses': 'página de cursos - catálogo de cursos disponibles para aprendizaje',
    '/workshops': 'página de talleres - eventos y sesiones de formación',
    '/news': 'página de noticias - últimas actualizaciones y anuncios',
    '/dashboard': 'panel principal del usuario - vista general de su actividad',
    '/prompt-directory': 'directorio de prompts - colección de plantillas de prompts de IA',
    '/business-panel': 'panel de negocios - herramientas para empresas',
    '/profile': 'página de perfil de usuario',
  };

  if (contextMap[pathname]) {
    return contextMap[pathname];
  }

  for (const [path, description] of Object.entries(contextMap)) {
    if (pathname.includes(path)) {
      return description;
    }
  }

  return 'página principal de la plataforma';
}

export function extractPageContent(): {
  title: string;
  metaDescription: string;
  headings: string[];
  mainText: string;
} {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { title: '', metaDescription: '', headings: [], mainText: '' };
  }

  const title = document.title || '';

  const metaDesc =
    document.querySelector('meta[name="description"]')?.getAttribute('content') ||
    document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
    '';

  const headings: string[] = [];
  document.querySelectorAll('h1').forEach(h => {
    const text = h.textContent?.trim();
    if (text && text.length > 0) headings.push(text);
  });
  document.querySelectorAll('h2').forEach(h => {
    const text = h.textContent?.trim();
    if (text && text.length > 0 && headings.length < 5) headings.push(text);
  });

  let mainText = '';
  const mainSelectors = ['main', '[role="main"]', '#main-content', '.main-content', 'article', '.content', '.container'];
  let mainElement: Element | null = null;
  for (const selector of mainSelectors) {
    mainElement = document.querySelector(selector);
    if (mainElement) break;
  }

  const unwantedSelectors = ['script', 'style', 'nav', 'header', 'footer', '.nav', '.navbar'];

  if (mainElement) {
    const clone = mainElement.cloneNode(true) as Element;
    unwantedSelectors.forEach(sel => clone.querySelectorAll(sel).forEach(el => el.remove()));
    mainText = clone.textContent?.trim() || '';
  } else {
    const bodyClone = document.body.cloneNode(true) as Element;
    unwantedSelectors.forEach(sel => bodyClone.querySelectorAll(sel).forEach(el => el.remove()));
    mainText = bodyClone.textContent?.trim() || '';
  }

  if (mainText.length > 800) {
    mainText = mainText.substring(0, 800) + '...';
  }
  mainText = mainText.replace(/\s+/g, ' ').trim();

  return { title, metaDescription: metaDesc, headings: headings.slice(0, 5), mainText };
}

export function renderTextWithLinks(
  text: string,
  onNavigate: (url: string) => void
): React.ReactNode {
  if (!text) return text;

  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = text.substring(lastIndex, match.index);
      if (textBefore) parts.push(textBefore);
    }

    const linkText = match[1];
    const linkUrl = match[2];
    const isRelative = linkUrl.startsWith('/');

    parts.push(
      React.createElement(
        'a',
        {
          key: `link-${key++}`,
          href: linkUrl,
          onClick: (e: React.MouseEvent) => {
            if (isRelative) {
              e.preventDefault();
              onNavigate(linkUrl);
            }
          },
          className:
            'text-accent dark:text-accent hover:text-accent dark:hover:text-accent underline font-medium transition-colors',
          ...(!isRelative && { target: '_blank', rel: 'noopener noreferrer' }),
        },
        linkText
      )
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
