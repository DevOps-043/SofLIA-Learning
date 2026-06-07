export const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
  'about:',
];

export const EVENT_HANDLERS = [
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

export const ALLOWED_CSS_CLASSES = [
  /^text-(left|center|right|justify)$/,
  /^text-(xs|sm|base|lg|xl|\d+xl)$/,
  /^text-(gray|blue|red|green|yellow)-\d{3}$/,
  /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/,
  /^(italic|underline|line-through)$/,
  /^(m|p)(t|r|b|l|x|y)?-\d+$/,
  /^(block|inline-block|inline|flex|grid|hidden)$/,
  /^border(-\d+)?$/,
  /^rounded(-\w+)?$/,
];

export const BLOCKED_URL_PATTERNS = [
  /bit\.ly/i,
  /tinyurl/i,
  /goo\.gl/i,
];
