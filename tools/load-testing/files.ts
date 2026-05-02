import fs from 'node:fs/promises';
import path from 'node:path';
import type { RequestMetric, SeedManifest } from './types';

export async function ensureResultDir(resultDir: string) {
  await fs.mkdir(resultDir, { recursive: true });
}

export function manifestPath(resultDir: string) {
  return path.join(resultDir, 'users.json');
}

export function metricsPath(resultDir: string) {
  return path.join(resultDir, 'events.jsonl');
}

export function snapshotsPath(resultDir: string) {
  return path.join(resultDir, 'snapshots.jsonl');
}

export function runSummaryPath(resultDir: string) {
  return path.join(resultDir, 'run-summary.json');
}

export async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export async function readSeedManifest(resultDir: string): Promise<SeedManifest> {
  const filePath = manifestPath(resultDir);
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as SeedManifest;
}

export class JsonlWriter<T extends object = RequestMetric> {
  private readonly buffer: string[] = [];
  private writeChain = Promise.resolve();

  constructor(private readonly filePath: string, private readonly flushSize = 500) {}

  async reset() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, '', 'utf8');
  }

  write(value: T) {
    this.buffer.push(JSON.stringify(value));
    if (this.buffer.length >= this.flushSize) {
      void this.flush();
    }
  }

  async flush() {
    if (this.buffer.length === 0) return;

    const payload = `${this.buffer.splice(0).join('\n')}\n`;
    this.writeChain = this.writeChain.then(() => fs.appendFile(this.filePath, payload, 'utf8'));
    await this.writeChain;
  }
}
