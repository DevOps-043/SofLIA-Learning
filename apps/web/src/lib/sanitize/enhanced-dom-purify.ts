import type { Config as DOMPurifyConfig } from 'dompurify';
import DOMPurify from 'isomorphic-dompurify';

import { hardenAnchorTags } from './dom-purify.attribute-utils';
import { SECURE_RICH_TEXT_CONFIG } from './dom-purify.config';
import { setupDOMPurifyHooks } from './dom-purify.hooks';
import { getDOMPurify } from './dom-purify.instance';
import {
  stripHtmlPreservingText,
  toSanitizedString,
} from './dom-purify.node-utils';

export { SECURE_RICH_TEXT_CONFIG } from './dom-purify.config';
export { setupDOMPurifyHooks } from './dom-purify.hooks';

export function enhancedSanitizeHTML(
  dirty: string | null | undefined,
  config?: DOMPurifyConfig
): string {
  if (!dirty) return '';

  if (typeof window !== 'undefined') setupDOMPurifyHooks();
  const sanitized = DOMPurify.sanitize(dirty, {
    ...SECURE_RICH_TEXT_CONFIG,
    ...config,
  });

  return hardenAnchorTags(toSanitizedString(sanitized));
}

export function sanitizePlainText(dirty: string | null | undefined): string {
  if (!dirty) return '';
  return stripHtmlPreservingText(enhancedSanitizeHTML(dirty));
}

export function isHTMLSafe(text: string): boolean {
  if (!text) return true;
  return enhancedSanitizeHTML(text) === text;
}

export function extractTextFromHTML(html: string | null | undefined): string {
  if (!html) return '';
  return stripHtmlPreservingText(enhancedSanitizeHTML(html));
}

export function initializeSecureDOMPurify(): void {
  const domPurify = getDOMPurify();
  if (!domPurify) return;

  setupDOMPurifyHooks();
  domPurify.setConfig({
    ...SECURE_RICH_TEXT_CONFIG,
  });
}

if (typeof window !== 'undefined') {
  initializeSecureDOMPurify();
}
