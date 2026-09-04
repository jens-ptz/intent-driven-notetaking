import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { API_BASE_URL, API_DIR, API_PORT, WEB_BASE_URL, WEB_DIR, WEB_PORT, apiEnv } from './config.js';

const children = [];

function run(command, args, options) {
  const child = spawn(command, args, { stdio: 'pipe', ...options });
  children.push(child);
  const output = [];
  child.stdout?.on('data', (chunk) => output.push(String(chunk)));
  child.stderr?.on('data', (chunk) => output.push(String(chunk)));
  child.on('exit', (code) => {
    if (code !== null && code !== 0 && !child.expectedExit) {
      process.stderr.write(`\n[acceptance] ${command} exited with ${code}:\n${output.join('')}\n`);
    }
  });
  return { child, output };
}

/** Runs a command to completion, rejecting with its combined output on failure. */
export function exec(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: 'pipe', ...options });
    const output = [];
    child.stdout.on('data', (chunk) => output.push(String(chunk)));
    child.stderr.on('data', (chunk) => output.push(String(chunk)));
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise(output.join(''));
      } else {
        reject(new Error(`${command} ${args.join(' ')} failed (${code}):\n${output.join('')}`));
      }
    });
  });
}

async function waitFor(label, probe, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = 'no attempt made';
  while (Date.now() < deadline) {
    try {
      if (await probe()) {
        return;
      }
      lastError = 'probe returned false';
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${label}: ${lastError}`);
}

export async function startApi() {
  run('node', ['dist/main.js'], { cwd: API_DIR, env: apiEnv() });
  await waitFor(`the API on port ${API_PORT}`, async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  });
}

export async function startWeb() {
  run('npx', ['vite', '--port', String(WEB_PORT), '--strictPort'], {
    cwd: WEB_DIR,
    env: { ...process.env, WEB_PORT: String(WEB_PORT), API_PORT: String(API_PORT) },
  });
  await waitFor(`Vite on port ${WEB_PORT}`, async () => {
    const response = await fetch(WEB_BASE_URL);
    return response.ok;
  });
}

export async function stopAll() {
  for (const child of children) {
    child.expectedExit = true;
    child.kill('SIGTERM');
  }
  children.length = 0;
  await delay(200);
}
