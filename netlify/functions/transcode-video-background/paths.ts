export function even(n: number): number {
  return Math.max(2, Math.round(n / 2) * 2)
}

export function joinStoragePath(...parts: string[]): string {
  return parts.map((part) => part.replace(/^\/+|\/+$/g, '')).filter(Boolean).join('/')
}

export function getStorageDirectory(p: string): string {
  const norm = p.replace(/\\/g, '/')
  const index = norm.lastIndexOf('/')
  return index >= 0 ? norm.slice(0, index) : ''
}

export function getStorageBasename(p: string): string {
  const norm = p.replace(/\\/g, '/')
  const index = norm.lastIndexOf('/')
  return index >= 0 ? norm.slice(index + 1) : norm
}

export function stripExtension(name: string): string {
  const index = name.lastIndexOf('.')
  return index >= 0 ? name.slice(0, index) : name
}
