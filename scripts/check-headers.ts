import { type Gate, fail, pass, runGate } from './gates/gate.ts';

// RUN-16 против живого адреса: `pnpm check:headers` на wrangler dev или на проде.
// Печатает три заголовка ожидаемого вида — форма приёмки задачи T-010.
const TARGET = process.env['DOKEY_TARGET'] ?? 'http://127.0.0.1:8788';

const EXPECTED = ['content-security-policy', 'strict-transport-security', 'cache-control'] as const;

export const gate: Gate = {
  id: 'RUN-16',
  command: 'check:headers',
  claim: 'живой origin отдаёт объявленные заголовки',
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

    if (missing.length > 0) return fail(`${TARGET} не отдаёт: ${missing.join(', ')}`);
    return pass(`${TARGET}\n${lines.join('\n')}`);
  },
};

if (import.meta.filename === process.argv[1]) await runGate(gate);
