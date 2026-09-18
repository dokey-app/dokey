import { type Gate, fail, pass, runGate } from './gates/gate.ts';

// RUN-16 против живого адреса: `pnpm check:headers` на wrangler dev или на проде.
// Печатает три заголовка ожидаемого вида — форма приёмки задачи T-010.
const TARGET = process.env['DOKEY_TARGET'] ?? 'http://127.0.0.1:8788';

const EXPECTED = ['content-security-policy', 'strict-transport-security', 'cache-control'] as const;

// D-180: заголовки, объявляющие браузеру адрес для отчётов, — сторонний origin мимо CSP (ИНВ-01).
// Cloudflare дописывает `nel` и `report-to` настройкой зоны, а не из `_headers`.
const FORBIDDEN = ['nel', 'report-to', 'reporting-endpoints'] as const;

export const gate: Gate = {
  id: 'RUN-16',
  command: 'check:headers',
  claim: 'живой origin отдаёт объявленные заголовки и не объявляет адресов отчётов',
  enabledIn: 'Э-0',
  async run() {
    let response: Response;
    try {
      response = await fetch(TARGET, { redirect: 'manual' });
    } catch (error) {
      return fail(`${TARGET} не отвечает: ${(error as Error).message}`);
    }

    const missing: string[] = [];
    const lines: string[] = [];
    for (const name of EXPECTED) {
      const value = response.headers.get(name);
      if (value === null) missing.push(name);
      else lines.push(`  ${name}: ${value}`);
    }

    const forbidden: string[] = [];
    for (const name of FORBIDDEN) {
      const value = response.headers.get(name);
      if (value !== null) forbidden.push(`  ${name}: ${value}`);
    }

    const problems: string[] = [];
    if (missing.length > 0) problems.push(`не отдаёт: ${missing.join(', ')}`);
    if (forbidden.length > 0) {
      problems.push(`объявляет адрес отчётов (ИНВ-01, D-180):\n${forbidden.join('\n')}`);
    }
    if (problems.length > 0) return fail(`${TARGET} ${problems.join('\n')}`);
    return pass(`${TARGET}\n${lines.join('\n')}`);
  },
};

if (import.meta.filename === process.argv[1]) await runGate(gate);
