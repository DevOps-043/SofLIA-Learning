/**
 * Enhanced DOMPurify Configuration
 *
 * Configuracion mejorada de DOMPurify con hooks adicionales
 * para prevenir ataques XSS avanzados.
 */

import createDOMPurify, {
  type Config as DOMPurifyConfig,
  type DOMPurify as DOMPurifyInstance,
} from 'dompurify';

let domPurifyInstance: DOMPurifyInstance | null = null;
let hooksConfigured = false;

function stripHtmlPreservingText(html: string): string {
  if (!html) {
    return '';
  }

  if (typeof window !== 'undefined') {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }

  return html.replace(/<[^>]*>/g, '');
}

function getDOMPurify(): DOMPurifyInstance | null {
  if (typeof window === 'undefined') {
    return null;
  }

  domPurifyInstance ??= createDOMPurify(window);
  return domPurifyInstance;
}

function isElementNode(node: Node): node is Element {
  return node instanceof Element;
}

function toSanitizedString(value: string | Node): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Element) {
    return value.outerHTML;
  }

  return value.textContent ?? '';
}

function getAttributeValue(attributes: string, attributeName: string): string | null {
  const match = attributes.match(
    new RegExp(`${attributeName}\\s*=\\s*["']([^"']*)["']`, 'i'),
  );

  return match?.[1] ?? null;
}

function upsertAttribute(attributes: string, attributeName: string, value: string): string {
  const attributePattern = new RegExp(
    `${attributeName}\\s*=\\s*["'][^"']*["']`,
    'i',
  );

  if (attributePattern.test(attributes)) {
    return attributes.replace(attributePattern, `${attributeName}="${value}"`);
  }

  return `${attributes.trimEnd()} ${attributeName}="${value}"`;
}

function hardenAnchorTags(html: string): string {
  return html.replace(/<a\b([^>]*)>/gi, (fullMatch, rawAttributes: string) => {
    let attributes = rawAttributes;
    const href = getAttributeValue(attributes, 'href');
    const target = getAttributeValue(attributes, 'target');

    if (target === '_blank') {
      const relValues = new Set(
        (getAttributeValue(attributes, 'rel') || '')
          .split(/\s+/)
          .filter(Boolean),
      );

      relValues.add('noopener');
      relValues.add('noreferrer');
      attributes = upsertAttribute(
        attributes,
        'rel',
        Array.from(relValues).join(' '),
      );
    }

    if (href && /^https?:\/\//i.test(href)) {
      attributes = upsertAttribute(attributes, 'data-external', 'true');
    }

    return `<a${attributes}>`;
  });
}

function isExternalUrl(url: string): boolean {
  return typeof window !== 'undefined' && window.location
    ? url.startsWith('http') && !url.includes(window.location.hostname)
    : false;
}

/**
 * Lista de protocolos peligrosos que deben ser bloqueados
 */
const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
  'about:',
];

/**
 * Lista de atributos de eventos que deben ser bloqueados
 */
const EVENT_HANDLERS = [
  'onload',
  'onerror',
  'onclick',
  'onmouseover',
  'onfocus',
  'onblur',
  'onchange',
  'oninput',
  'onsubmit',
  'onkeydown',
  'onkeyup',
  'onkeypress',
];

/**
 * Clases CSS permitidas (whitelist)
 */
const ALLOWED_CSS_CLASSES = [
  /^text-(xs|sm|base|lg|xl|\d+xl)$/,
  /^text-(gray|blue|red|green|yellow)-\d{3}$/,
  /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/,
  /^(italic|underline|line-through)$/,
  /^(m|p)(t|r|b|l|x|y)?-\d+$/,
  /^(block|inline-block|inline|flex|grid|hidden)$/,
  /^border(-\d+)?$/,
  /^rounded(-\w+)?$/,
];

/**
 * URLs prohibidas (phishing, malware)
 */
const BLOCKED_URL_PATTERNS = [
  /bit\.ly/i,
  /tinyurl/i,
  /goo\.gl/i,
];

/**
 * Configura hooks de DOMPurify para validacion adicional.
 */
export function setupDOMPurifyHooks(): void {
  const domPurify = getDOMPurify();

  if (!domPurify || hooksConfigured) {
    return;
  }

  domPurify.addHook('uponSanitizeAttribute', (_node, data) => {
    const { attrName, attrValue } = data;

    if (EVENT_HANDLERS.includes(attrName.toLowerCase())) {
      data.forceKeepAttr = false;
      data.attrValue = '';
      return;
    }

    if (attrName === 'href' || attrName === 'src') {
      const url = attrValue.toLowerCase();

      for (const protocol of DANGEROUS_PROTOCOLS) {
        if (url.startsWith(protocol)) {
          data.forceKeepAttr = false;
          data.attrValue = '';
          return;
        }
      }

      for (const pattern of BLOCKED_URL_PATTERNS) {
        if (pattern.test(url)) {
          data.forceKeepAttr = false;
          data.attrValue = '';
          return;
        }
      }
    }

    if (attrName === 'class') {
      const classes = attrValue.split(/\s+/).filter(Boolean);
      const validClasses = classes.filter((className) => {
        return ALLOWED_CSS_CLASSES.some((pattern) => pattern.test(className));
      });

      if (validClasses.length === 0) {
        data.forceKeepAttr = false;
        data.attrValue = '';
      } else {
        data.attrValue = validClasses.join(' ');
      }
    }

    if (attrName === 'title') {
      data.attrValue = attrValue.replace(/<[^>]*>/g, '');
    }
  });

  domPurify.addHook('uponSanitizeElement', (node, data) => {
    const { tagName } = data;

    if (!isElementNode(node)) {
      return;
    }

    if (tagName === 'script' || tagName === 'style') {
      node.parentNode?.removeChild(node);
      return;
    }

    if (tagName === 'form' && node instanceof HTMLFormElement) {
      const formElement = node;

      if (formElement.hasAttribute('action')) {
        const action = formElement.getAttribute('action') || '';
        if (isExternalUrl(action)) {
          formElement.removeAttribute('action');
        }
      }

      formElement.removeAttribute('onsubmit');
      formElement.removeAttribute('oninput');
    }

    if (tagName === 'a' && node instanceof HTMLAnchorElement) {
      const linkElement = node;

      if (linkElement.getAttribute('target') === '_blank') {
        const currentRel = linkElement.getAttribute('rel') || '';
        const relValues = currentRel.split(/\s+/).filter(Boolean);

        if (!relValues.includes('noopener')) {
          relValues.push('noopener');
        }
        if (!relValues.includes('noreferrer')) {
          relValues.push('noreferrer');
        }

        linkElement.setAttribute('rel', relValues.join(' '));
      }

      const href = linkElement.getAttribute('href') || '';
      if (isExternalUrl(href)) {
        linkElement.setAttribute('data-external', 'true');
      }
    }

    if (tagName === 'img' && node instanceof HTMLImageElement) {
      const imgElement = node;

      if (!imgElement.hasAttribute('loading')) {
        imgElement.setAttribute('loading', 'lazy');
      }

      imgElement.removeAttribute('onerror');
      imgElement.removeAttribute('onload');

      const src = imgElement.getAttribute('src') || '';
      if (!src || DANGEROUS_PROTOCOLS.some((protocol) => src.toLowerCase().startsWith(protocol))) {
        imgElement.remove();
      }
    }
  });

  domPurify.addHook('afterSanitizeAttributes', (node) => {
    if (!isElementNode(node)) {
      return;
    }

    if (node instanceof HTMLAnchorElement) {
      if (node.getAttribute('target') === '_blank') {
        const currentRel = node.getAttribute('rel') || '';
        const relValues = currentRel.split(/\s+/).filter(Boolean);

        if (!relValues.includes('noopener')) {
          relValues.push('noopener');
        }
        if (!relValues.includes('noreferrer')) {
          relValues.push('noreferrer');
        }

        node.setAttribute('rel', relValues.join(' '));
      }

      const href = node.getAttribute('href') || '';
      if (isExternalUrl(href)) {
        node.setAttribute('data-external', 'true');
      }
    }

    const attributes = Array.from(node.attributes);

    for (const attribute of attributes) {
      if (attribute.name.toLowerCase().startsWith('on')) {
        node.removeAttribute(attribute.name);
      }
    }
  });

  hooksConfigured = true;
}

/**
 * Configuracion de DOMPurify con maxima seguridad
 */
export const SECURE_RICH_TEXT_CONFIG: DOMPurifyConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'span',
    'strong', 'em', 'u', 'b', 'i',
    'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4',
    'blockquote', 'code', 'pre',
    'a',
  ],
  ALLOWED_ATTR: [
    'href',
    'title',
    'class',
    'rel',
    'target',
    'data-external',
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|sms):)|^(?:\/|#)/i,
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  SAFE_FOR_TEMPLATES: true,
  WHOLE_DOCUMENT: false,
  FORCE_BODY: false,
  SANITIZE_DOM: true,
  IN_PLACE: false,
  CUSTOM_ELEMENT_HANDLING: {
    tagNameCheck: /^$/,
    attributeNameCheck: /^$/,
    allowCustomizedBuiltInElements: false,
  },
};

/**
 * Sanitiza HTML con configuracion segura mejorada
 */
export function enhancedSanitizeHTML(
  dirty: string | null | undefined,
  config?: DOMPurifyConfig
): string {
  if (!dirty) {
    return '';
  }

  const domPurify = getDOMPurify();
  if (!domPurify) {
    return hardenAnchorTags(
      dirty
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, ''),
    );
  }

  setupDOMPurifyHooks();

  const sanitized = domPurify.sanitize(dirty, {
    ...SECURE_RICH_TEXT_CONFIG,
    ...config,
  });

  return toSanitizedString(sanitized);
}

/**
 * Sanitiza texto plano (sin permitir ningun HTML)
 */
export function sanitizePlainText(dirty: string | null | undefined): string {
  if (!dirty) {
    return '';
  }

  return stripHtmlPreservingText(enhancedSanitizeHTML(dirty));
}

/**
 * Valida que un string no contenga HTML peligroso
 */
export function isHTMLSafe(text: string): boolean {
  if (!text) {
    return true;
  }

  const sanitized = enhancedSanitizeHTML(text);
  return sanitized === text;
}

/**
 * Extrae solo el texto de un HTML (strips all tags)
 */
export function extractTextFromHTML(html: string | null | undefined): string {
  if (!html) {
    return '';
  }

  return stripHtmlPreservingText(enhancedSanitizeHTML(html));
}

/**
 * Inicializa DOMPurify con configuracion segura al cargar la app
 */
export function initializeSecureDOMPurify(): void {
  const domPurify = getDOMPurify();

  if (!domPurify) {
    return;
  }

  setupDOMPurifyHooks();
  domPurify.setConfig({
    ...SECURE_RICH_TEXT_CONFIG,
  });
}

if (typeof window !== 'undefined') {
  initializeSecureDOMPurify();
}
