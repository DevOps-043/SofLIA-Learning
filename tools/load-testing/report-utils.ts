export function round(value: number) {
  return Math.round(value * 100) / 100
}

export async function readJsonFile<T>(filePath: string): Promise<T | null> {
  const fsp = await import('node:fs/promises')

  try {
    return JSON.parse(await fsp.readFile(filePath, 'utf8')) as T
  } catch {
    return null
  }
}
