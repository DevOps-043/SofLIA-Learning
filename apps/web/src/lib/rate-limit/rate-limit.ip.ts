export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP.trim();

  const cfIP = request.headers.get('cf-connecting-ip');
  if (cfIP) return cfIP.trim();

  return '127.0.0.1';
}
