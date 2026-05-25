import { access, chmod, constants as fsConstants, readdir } from 'node:fs/promises';
import path from 'node:path';

let cachedFfmpegPath: string | null = null;

export async function resolveFfmpegPath(): Promise<string> {
  if (cachedFfmpegPath) return cachedFfmpegPath;

  const candidates = getFfmpegCandidates();
  const probes: Array<{ path: string; exists: boolean; executable: boolean }> = [];

  for (const candidate of candidates) {
    const resolved = await tryResolveCandidate(candidate);
    if (resolved) {
      cachedFfmpegPath = resolved;
      return resolved;
    }
    probes.push({ path: candidate, exists: await fileExists(candidate), executable: false });
  }

  await logResolutionDiagnostics(probes, candidates);
  throw new Error(`ffmpeg binary not found in any candidate path. Tried: ${candidates.join(', ')}`);
}

function getFfmpegCandidates() {
  return [
    process.env.FFMPEG_PATH ?? null,
    '/var/task/apps/web/bin/ffmpeg',
    path.join(process.cwd(), 'apps/web/bin/ffmpeg'),
    path.join(__dirname, 'apps/web/bin/ffmpeg'),
    path.join(__dirname, '../apps/web/bin/ffmpeg'),
    path.join(__dirname, '../../apps/web/bin/ffmpeg'),
    path.join(__dirname, '../../../apps/web/bin/ffmpeg'),
    '/var/task/bin/ffmpeg',
    '/opt/build/repo/apps/web/bin/ffmpeg'
  ].filter((candidate): candidate is string => Boolean(candidate));
}

async function tryResolveCandidate(candidate: string) {
  if (!(await fileExists(candidate))) return null;
  if (await isExecutable(candidate)) return logResolved(candidate);

  try {
    await chmod(candidate, 0o755);
    if (await isExecutable(candidate)) return logResolved(candidate, true);
  } catch {
    // Keep probing other candidates.
  }

  return null;
}

function logResolved(candidate: string, chmodApplied = false) {
  console.log(`[transcode-bg] Resolved ffmpeg at: ${candidate}${chmodApplied ? ' (chmod +x applied)' : ''}`);
  return candidate;
}

async function isExecutable(filePath: string) {
  try {
    await access(filePath, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function fileExists(filePath: string) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function logResolutionDiagnostics(probes: unknown, candidates: string[]) {
  const dirListings: Record<string, string[] | string> = {};
  for (const dir of ['/var/task', '/var/task/apps', '/var/task/apps/web', '/var/task/apps/web/bin', process.cwd(), __dirname]) {
    try {
      dirListings[dir] = (await readdir(dir)).slice(0, 40);
    } catch (error) {
      dirListings[dir] = `error: ${error instanceof Error ? error.message : 'unknown'}`;
    }
  }
  console.error('[transcode-bg] Could not locate ffmpeg. Probes:', probes);
  console.error('[transcode-bg] Candidates:', candidates);
  console.error('[transcode-bg] Directory listings:', dirListings);
}
