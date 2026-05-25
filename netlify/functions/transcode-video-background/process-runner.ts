import { spawn } from 'node:child_process';

interface RunProcessOptions {
  acceptNonZeroExit?: boolean;
  maxOutputBytes?: number;
}

export function runProcess(
  command: string,
  args: string[],
  timeoutMs: number,
  options: RunProcessOptions = {}
): Promise<string> {
  const { acceptNonZeroExit = false, maxOutputBytes = 12_000 } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { shell: false, windowsHide: true });
    let output = '';
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGKILL');
      reject(new Error(`Process timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    const append = (chunk: Buffer) => {
      output += chunk.toString();
      if (output.length > maxOutputBytes) output = output.slice(-maxOutputBytes);
    };

    child.stdout.on('data', append);
    child.stderr.on('data', append);
    child.on('error', (error: NodeJS.ErrnoException) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error.code === 'ENOENT'
        ? new Error(`Binary not found or not executable: ${command}`)
        : error);
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (code === 0 || acceptNonZeroExit) resolve(output);
      else reject(new Error(output || `Process exited with code ${code ?? 'unknown'}`));
    });
  });
}
