/**
 * 🔒 Enhanced DOMPurify Configuration
 *
 * Configuración mejorada de DOMPurify con hooks adicionales
 * para prevenir ataques XSS avanzados
 *
 * @see https://github.com/cure53/DOMPurify
 * @see https://owasp.org/www-community/attacks/xss/
 */

// Importación dinámica de DOMPurify solo en el cliente
let DOMPurify: any = null;

if (typeof window !== 'undefined') {
  // Solo importar DOMPurify en el cliente
  DOMPurify = require('dompurify');
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
 * Incluso si DOMPurify ya los bloquea, esta es una capa adicional
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
 * Solo se permiten clases de Tailwind CSS seguras
 */
const ALLOWED_CSS_CLASSES = [
  // Tailwind Typography
  /^text-(xs|sm|base|lg|xl|\d+xl)$/,
  /^text-(gray|blue|red|green|yellow)-\d{3}$/,
  /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/,
  /^(italic|underline|line-through)$/,

  // Spacing
  /^(m|p)(t|r|b|l|x|y)?-\d+$/,

  // Display
  /^(block|inline-block|inline|flex|grid|hidden)$/,

  // Borders
  /^border(-\d+)?$/,
  /^rounded(-\w+)?$/,

  // NUNCA permitir classes que puedan ejecutar código o cargar recursos externos
];

/**
 * URLs prohibidas (phishing, malware)
 * Puedes extender esta lista con feeds de threat intelligence
 */
const BLOCKED_URL_PATTERNS = [
  /bit\.ly/i, // Acortadores (pueden ocultar destino real)
  /tinyurl/i,
  /goo\.gl/i,
];

/**
 * Configura hooks de DOMPurify para validación adicional
 */
export function setupDOMPurifyHooks(): void {
  // Solo funciona en el cliente
  if (typeof window === 'undefined' || !DOMPurify) {
    return;
  }

  // Hook: Validar atributos antes de ser añadidos
  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    const { attrName, attrValue } = data;

    // Bloquear atributos de eventos (defense in depth)
    if (EVENT_HANDLERS.includes(attrName.toLowerCase())) {
      data.forceKeepAttr = false;
      data.attrValue = '';
      return;
    }

    // Validar URLs en href y src
    if (attrName === 'href' || attrName === 'src') {
      const url = attrValue.toLowerCase();

      // Bloquear protocolos peligrosos
      for (const protocol of DANGEROUS_PROTOCOLS) {
        if (url.startsWith(protocol)) {
          data.forceKeepAttr = false;
          data.attrValue = '';
          return;
        }
      }

      // Bloquear URLs sospechosas
      for (const pattern of BLOCKED_URL_PATTERNS) {
        if (pattern.test(url)) {
          data.forceKeepAttr = false;
          data.attrValue = '';
          return;
        }
      }
    }

    // Validar clases CSS (whitelist)
    if (attrName === 'class') {
      const classes = attrValue.split(/\s+/);
      const validClasses = classes.filter(className => {
        return ALLOWED_CSS_CLASSES.some(pattern => pattern.test(className));
      });

      if (validClasses.length === 0) {
        data.forceKeepAttr = false;
        data.attrValue = '';
      } else {
        data.attrValue = validClasses.join(' ');
      }
    }

    // Validar que title no contenga HTML
    if (attrName === 'title') {
      // Remover cualquier intento de HTML en title
      data.attrValue = attrValue.replace(/<[^>]*>/g, '');
    }
  });

  // Hook: Validar elementos antes de ser añadidos
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    const { tagName } = data;

    // Remover elementos script (aunque DOMPurify ya lo hace)
    if (tagName === 'script') {
      node.remove();
      return;
    }

    // Remover elementos style (inline CSS puede ser peligroso)
    if (tagName === 'style') {
      node.remove();
      return;
    }

    // Validar elementos form (prevenir auto-submit)
    if (tagName === 'form') {
      const formElement = node as HTMLFormElement;

      // Remover action si apunta a URL externa
      if (formElement.hasAttribute('action')) {
        const action = formElement.getAttribute('action') || '';

        if (action.startsWith('http') && typeof window !== 'undefined' && window.location && !action.includes(window.location.hostname)) {
          formElement.removeAttribute('action');
        }
      }

      // Remover atributos peligrosos de form
      formElement.removeAttribute('onsubmit');
      formElement.removeAttribute('oninput');
    }

    // Validar enlaces (a) para prevenir target="_blank" sin rel="noopener"
    if (tagName === 'a') {
      const linkElement = node as HTMLAnchorElement;

      if (linkElement.getAttribute('target') === '_blank') {
        const currentRel = linkElement.getAttribute('rel') || '';
        const relValues = currentRel.split(/\s+/);

        if (!relValues.includes('noopener')) {
          relValues.push('noopener');
        }
        if (!relValues.includes('noreferrer')) {
          relValues.push('noreferrer');
        }

        linkElement.setAttribute('rel', relValues.join(' '));
      }

      // Agregar indicador visual para links externos
      const href = linkElement.getAttribute('href') || '';
      if (href.startsWith('http') && typeof window !== 'undefined' && window.location && !href.includes(window.location.hostname)) {
        linkElement.setAttribute('data-external', 'true');
      }
    }

    // Validar imágenes
    if (tagName === 'img') {
      const imgElement = node as HTMLImageElement;

      // Forzar lazy loading
      if (!imgElement.hasAttribute('loading')) {
        imgElement.setAttribute('loading', 'lazy');
      }

      // Remover onerror (puede ejecutar código)
      imgElement.removeAttribute('onerror');
      imgElement.removeAttribute('onload');

      // Validar src
      const src = imgElement.getAttribute('src') || '';
      if (!src || DANGEROUS_PROTOCOLS.some(p => src.toLowerCase().startsWith(p))) {
        imgElement.remove();
      }
    }
  });

  // Hook: Después de sanitización
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Remover cualquier atributo que empiece con "on" (eventos)
    if (node.attributes) {
      const attrs = Array.from(node.attributes);

      for (const attr of attrs) {
        if (attr.name.toLowerCase().startsWith('on')) {
          node.removeAttribute(attr.name);
        }
      }
    }
  });
}

/**
 * Configuración de DOMPurify con máxima seguridad
 */
export const SECURE_RICH_TEXT_CONFIG = {
  ALLOWED_TAGS: [
    // Solo tags esenciales para rich text
    'p', 'br', 'span',
    'strong', 'em', 'u', 'b', 'i',
    'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4',
    'blockquote', 'code', 'pre',
    'a',
  ],
  ALLOWED_ATTR: [
    'href', // Solo para <a>
    'title', // Para tooltips
    'class', // Solo clases whitelisted (validadas en hook)
    'rel', // Para noopener/noreferrer en links
    'target', // Para _blank en links (pero forzamos rel)
    'data-external', // Para marcar links externos
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|sms):)|^(?:\/|#)/i, // Solo https, mailto, tel, sms, rutas relativas
  ALLOW_DATA_ATTR: false, // ❌ No permitir data-* attributes (pueden contener código)
  ALLOW_UNKNOWN_PROTOCOLS: false, // ❌ No permitir protocolos desconocidos
  KEEP_CONTENT: true, // Mantener contenido de texto
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  SAFE_FOR_TEMPLATES: true, // Seguro para templates (escapa {{ }})
  WHOLE_DOCUMENT: false,
  FORCE_BODY: false,

  // Sanitización agresiva
  SANITIZE_DOM: true, // Sanitizar DOM completamente
  IN_PLACE: false, // No modificar el DOM original

  // Configuraciones anti-mXSS
  CUSTOM_ELEMENT_HANDLING: {
    tagNameCheck: /^$/,  // No permitir custom elements
    attributeNameCheck: /^$/,  // No permitir custom attributes
    allowCustomizedBuiltInElements: false,
  },
};

/**
 * Sanitiza HTML con configuración segura mejorada
 *
 * @param dirty - HTML a sanitizar
 * @param config - Configuración personalizada (opcional)
 * @returns HTML sanitizado
 */
export function enhancedSanitizeHTML(
  dirty: string | null | undefined,
  config?: any
): string {
  if (!dirty) {
    return '';
  }

  // Si estamos en el servidor, usar sanitización básica
  if (typeof window === 'undefined' || !DOMPurify) {
    // Sanitización básica para servidor
    return dirty
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '');
  }

  // Asegurar que los hooks están configurados
  setupDOMPurifyHooks();

  // Merge config con defaults seguros
  const finalConfig = {
    ...SECURE_RICH_TEXT_CONFIG,
    ...config,
  };

  // Sanitizar
  const clean = DOMPurify.sanitize(dirty, finalConfig);

  return clean;
}

/**
 * Sanitiza texto plano (sin permitir ningún HTML)
 *
 * @param dirty - Texto a sanitizar
 * @returns Texto plano sin HTML
 */
export function sanitizePlainText(dirty: string | null | undefined): string {
  if (!dirty) {
    return '';
  }

  // Si estamos en el servidor, remover todo HTML
  if (typeof window === 'undefined' || !DOMPurify) {
    return dirty.replace(/<[^>]*>/g, '');
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

/**
 * Valida que un string no contenga HTML peligroso
 *
 * @param text - Texto a validar
 * @returns true si es seguro, false si contiene HTML peligroso
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
 *
 * @param html - HTML a procesar
 * @returns Solo el texto sin tags
 */
export function extractTextFromHTML(html: string | null | undefined): string {
  if (!html) {
    return '';
  }

  // Sanitizar primero
  const clean = enhancedSanitizeHTML(html);

  // Crear un elemento temporal para extraer texto
  if (typeof window !== 'undefined') {
    const temp = document.createElement('div');
    temp.innerHTML = clean;
    return temp.textContent || temp.innerText || '';
  }

  // Fallback: remover tags con regex (menos preciso)
  return clean.replace(/<[^>]*>/g, '');
}

/**
 * Inicializa DOMPurify con configuración segura al cargar la app
 * Llamar esto en _app.tsx o layout.tsx
 */
export function initializeSecureDOMPurify(): void {
  if (typeof window === 'undefined' || !DOMPurify) {
    return;
  }


  setupDOMPurifyHooks();

  // Configuración global de DOMPurify
  DOMPurify.setConfig({
    ...SECURE_RICH_TEXT_CONFIG,
  });

}

// Auto-inicializar en el browser
if (typeof window !== 'undefined' && DOMPurify) {
  initializeSecureDOMPurify();
}
