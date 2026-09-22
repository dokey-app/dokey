import { execFile } from 'node:child_process';
import { type Server, createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { beforeAll, describe, expect, it } from 'vitest';

// RUN-01. RUN-16 (D-180): ответ, объявляющий браузеру адрес для отчётов, — сторонний origin
// мимо CSP (ИНВ-01). Проверка — отдельным процессом, как её зовут `release.yml` и `synthetic.yml`:
// код выхода и чтение `DOKEY_TARGET` входят в предмет.

const SCRIPT = resolve('scripts/check-headers.ts');
const run = promisify(execFile);

const CLEAN = {
  'content-security-policy': "default-src 'self'",
  'strict-transport-security': 'max-age=31536000',
  'cache-control': 'public, max-age=0, must-revalidate',
};

// Значения — как их отдавал прод в T-011.
const REPORT_TO =
  '{"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4"}]}';
const NEL = '{"success_fraction":0.0,"report_to":"cf-nel","max_age":604800}';

const FORBIDDEN: Record<string, string> = {
  nel: NEL,
  'report-to': REPORT_TO,
  'reporting-endpoints': 'default="https://a.nel.cloudflare.com/report/v4"',
};

const { 'content-security-policy': _csp, ...WITHOUT_CSP } = CLEAN;

// Сценарии проверки. Каждый поднимает свой `node --experimental-strip-types`: на свободной машине
// это 1,5–4,7 с при таймауте случая 5 с, при занятых ядрах — больше таймаута, и падает то один
// случай, то другой. Поэтому все пять идут один раз на файл тестов и параллельно, а случай
// утверждает по записанному ответу (T-241).
const SCENARIOS: Record<string, Record<string, string>> = {
  'три заголовка': CLEAN,
  ...Object.fromEntries(
    Object.entries(FORBIDDEN).map(([name, value]) => [name, { ...CLEAN, [name]: value }]),
  ),
  'без csp': WITHOUT_CSP,
};

type Checked = { status: number; out: string };

const checked = new Map<string, Checked>();

async function checkAgainst(headers: Record<string, string>): Promise<Checked> {
  const server: Server = createServer((_, response) => {
    response.writeHead(200, headers).end();
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const { port } = server.address() as AddressInfo;
  try {
    const { stdout } = await run(process.execPath, ['--experimental-strip-types', SCRIPT], {
      env: { ...process.env, DOKEY_TARGET: `http://127.0.0.1:${port}` },
      encoding: 'utf8',
    });
    return { status: 0, out: stdout };
  } catch (error) {
    const failed = error as { code: number; stdout: string };
    return { status: failed.code, out: failed.stdout };
  } finally {
    await new Promise((done) => server.close(done));
  }
}

beforeAll(async () => {
  const answers = await Promise.all(
    Object.entries(SCENARIOS).map(async ([scenario, headers]): Promise<[string, Checked]> => {
      return [scenario, await checkAgainst(headers)];
    }),
  );
  for (const [scenario, answer] of answers) checked.set(scenario, answer);
}, 60_000);

// Сценарий без записанного ответа прошёл бы молча: «пусто» за «проверено» не выдаётся.
function answerOf(scenario: string): Checked {
  const answer = checked.get(scenario);
  if (!answer) throw new Error(`${scenario}: ответ проверки не записан`);
  return answer;
}

describe('RUN-16: заголовки живого origin', () => {
  it('проходит на трёх объявленных заголовках без адресов отчётов', () => {
    const { status, out } = answerOf('три заголовка');
    expect(out).toContain('OK');
    expect(status).toBe(0);
  });

  it.each(Object.entries(FORBIDDEN))(
    'падает на заголовке %s и называет его значение',
    (name, value) => {
      const { status, out } = answerOf(name);
      expect(status).toBe(1);
      expect(out).toContain('ПРОВАЛ');
      expect(out).toContain(`${name}: ${value}`);
      expect(out).toContain('D-180');
    },
  );

  it('падает, когда нет content-security-policy', () => {
    const { status, out } = answerOf('без csp');
    expect(status).toBe(1);
    expect(out).toContain('не отдаёт: content-security-policy');
  });
});
