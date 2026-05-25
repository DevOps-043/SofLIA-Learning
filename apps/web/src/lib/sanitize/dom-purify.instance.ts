import createDOMPurify, {
  type DOMPurify as DOMPurifyInstance,
} from 'dompurify';

let domPurifyInstance: DOMPurifyInstance | null = null;
let hooksConfigured = false;

export function getDOMPurify(): DOMPurifyInstance | null {
  if (typeof window === 'undefined') {
    return null;
  }

  domPurifyInstance ??= createDOMPurify(window);
  return domPurifyInstance;
}

export function areDOMPurifyHooksConfigured() {
  return hooksConfigured;
}

export function markDOMPurifyHooksConfigured() {
  hooksConfigured = true;
}

export type { DOMPurifyInstance };
