import { execFile } from 'node:child_process';
import { type Server, createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

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

async function checkAgainst(
  headers: Record<string, string>,
): Promise<{ status: number; out: string }> {
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

describe('RUN-16: заголовки живого origin', () => {
  it('проходит на трёх объявленных заголовках без адресов отчётов', async () => {
    const { status, out } = await checkAgainst(CLEAN);
    expect(out).toContain('OK');
    expect(status).toBe(0);
  });

  it.each([
    ['nel', NEL],
    ['report-to', REPORT_TO],
    ['reporting-endpoints', 'default="https://a.nel.cloudflare.com/report/v4"'],
  ])('падает на заголовке %s и называет его значение', async (name, value) => {
    const { status, out } = await checkAgainst({ ...CLEAN, [name]: value });
    expect(status).toBe(1);
    expect(out).toContain('ПРОВАЛ');
    expect(out).toContain(`${name}: ${value}`);
    expect(out).toContain('D-180');
  });

  it('падает, когда нет content-security-policy', async () => {
    const { 'content-security-policy': _, ...rest } = CLEAN;
    const { status, out } = await checkAgainst(rest);
    expect(status).toBe(1);
    expect(out).toContain('не отдаёт: content-security-policy');
  });
});
