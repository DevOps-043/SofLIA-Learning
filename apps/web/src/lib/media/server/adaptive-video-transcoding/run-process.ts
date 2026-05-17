import { spawn } from 'node:child_process';

export async function runProcess(
  command: string,
  args: string[],
  timeoutMs: number,
): Promise<string> {
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

    const appendOutput = (chunk: Buffer) => {
      output += chunk.toString();
      if (output.length > 12_000) output = output.slice(-12_000);
    };

    child.stdout.on('data', appendOutput);
    child.stderr.on('data', appendOutput);
    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error);
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);

      if (code === 0) {
        resolve(output);
        return;
      }

      reject(new Error(output || `Process exited with code ${code ?? 'unknown'}`));
    });
  });
}
