import {
  ALLOWED_CSS_CLASSES,
  BLOCKED_URL_PATTERNS,
  DANGEROUS_PROTOCOLS,
  EVENT_HANDLERS,
} from './dom-purify.constants';
import type { DOMPurifyInstance } from './dom-purify.instance';

export function configureSanitizeAttributeHook(
  domPurify: DOMPurifyInstance
): void {
  domPurify.addHook('uponSanitizeAttribute', (_node, data) => {
    const { attrName, attrValue } = data;

    if (EVENT_HANDLERS.includes(attrName.toLowerCase())) {
      data.forceKeepAttr = false;
      data.attrValue = '';
      return;
    }

    if (attrName === 'href' || attrName === 'src') {
      const url = attrValue.toLowerCase();
      const isBlockedProtocol = DANGEROUS_PROTOCOLS.some((protocol) =>
        url.startsWith(protocol),
      );
      const isBlockedUrl = BLOCKED_URL_PATTERNS.some((pattern) => pattern.test(url));

      if (isBlockedProtocol || isBlockedUrl) {
        data.forceKeepAttr = false;
        data.attrValue = '';
        return;
      }
    }

    if (attrName === 'class') {
      const classes = attrValue.split(/\s+/).filter(Boolean);
      const validClasses = classes.filter((className) =>
        ALLOWED_CSS_CLASSES.some((pattern) => pattern.test(className)),
      );

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
}
