import fs from 'node:fs'
import fsp from 'node:fs/promises'

import type { MetricsSnapshot } from './types'

export async function readSnapshots(filePath: string): Promise<MetricsSnapshot[]> {
  if (!fs.existsSync(filePath)) return []

  const raw = await fsp.readFile(filePath, 'utf8')
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as MetricsSnapshot)
}
