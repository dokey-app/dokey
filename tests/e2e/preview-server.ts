import { spawnSync } from 'node:child_process';

// Управление сервером предпросмотра для RUN-03.
//
// `webServer` Playwright здесь не годится: `astro preview` в Astro 7 уходит в фоновый
// процесс и отпускает свой — Playwright считает такой сервер упавшим, а порт остаётся
// занятым после прогона. Поэтому сервер поднимается и гасится явно, штатными командами
// каркаса `astro preview` и `astro preview stop`.
export const PORT = 4321;
export const BASE_URL = `http://127.0.0.1:${PORT}`;

const ASTRO = './node_modules/astro/bin/astro.mjs';

function astro(...args: string[]) {
  return spawnSync(process.execPath, [ASTRO, 'preview', ...args], { encoding: 'utf8' });
}

async function reachable(): Promise<boolean> {
  try {
    await fetch(BASE_URL, { signal: AbortSignal.timeout(2000) });
    return true;
  } catch {
    return false;
  }
}

export default async function globalSetup(): Promise<void> {
  astro('stop');
  const start = astro('--port', String(PORT), '--host', '127.0.0.1');
  if (start.status !== 0) {
    throw new Error(`astro preview не поднялся: ${start.stderr || start.stdout}`);
  }

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (await reachable()) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`${BASE_URL} не ответил за 60 с`);
}
