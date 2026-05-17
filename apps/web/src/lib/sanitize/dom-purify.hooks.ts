import { configureAfterSanitizeAttributesHook } from './dom-purify.after-hook';
import { configureSanitizeAttributeHook } from './dom-purify.attribute-hook';
import { configureSanitizeElementHook } from './dom-purify.element-hook';
import {
  areDOMPurifyHooksConfigured,
  getDOMPurify,
  markDOMPurifyHooksConfigured,
} from './dom-purify.instance';

export function setupDOMPurifyHooks(): void {
  const domPurify = getDOMPurify();

  if (!domPurify || areDOMPurifyHooksConfigured()) {
    return;
  }

  configureSanitizeAttributeHook(domPurify);
  configureSanitizeElementHook(domPurify);
  configureAfterSanitizeAttributesHook(domPurify);
  markDOMPurifyHooksConfigured();
}
