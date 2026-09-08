import { spawnSync } from 'node:child_process';

// Парная половина к preview-server.ts: гасит фоновый сервер предпросмотра после прогона.
// Без неё порт 4321 остаётся занятым, и следующий прогон стартует на чужом сервере.
export default function globalTeardown(): void {
  spawnSync(process.execPath, ['./node_modules/astro/bin/astro.mjs', 'preview', 'stop'], {
    encoding: 'utf8',
  });
}
