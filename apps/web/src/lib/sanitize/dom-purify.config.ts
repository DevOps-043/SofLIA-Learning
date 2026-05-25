import type { Config as DOMPurifyConfig } from 'dompurify';

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
