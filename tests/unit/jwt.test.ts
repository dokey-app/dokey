import { describe, expect, it } from 'vitest';
import {
  EXAMPLE,
  base64UrlToBytes,
  claimLabel,
  decodeJwt,
  formatInstant,
  relative,
  verifiability,
  verifyHmac,
  type DecodedJwt,
} from '../../src/tools/jwt/logic.ts';

const b64url = (text: string): string => Buffer.from(text).toString('base64url');

async function sign(header: object, payload: string, key: string, hash = 'SHA-256') {
  const input = `${b64url(JSON.stringify(header))}.${b64url(payload)}`;
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    { name: 'HMAC', hash },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(input));
  return `${input}.${Buffer.from(sig).toString('base64url')}`;
}

function decoded(token: string): DecodedJwt {
  const result = decodeJwt(token);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

describe('разбор', () => {
  it('пример разбирается: header, payload, claims', () => {
    const jwt = decoded(EXAMPLE);
    expect(jwt.alg).toBe('HS256');
    expect(jwt.header).toBe('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
    expect(jwt.payload).toContain('"name": "Ann Example"');
    expect(jwt.claims.map((c) => c.name)).toEqual(['exp', 'iat']);
  });

  it('пробелы вокруг и префикс Bearer игнорируются', () => {
    expect(decodeJwt(`  Bearer ${EXAMPLE}\n`).ok).toBe(true);
  });

  it('большие числа в payload не переписываются', async () => {
    const token = await sign({ alg: 'HS256' }, '{"id":12345678901234567890}', 'k');
    expect(decoded(token).payload).toContain('12345678901234567890');
  });

  it('UTF-8 в payload', async () => {
    const token = await sign({ alg: 'HS256' }, '{"name":"Анна"}', 'k');
    expect(decoded(token).payload).toContain('Анна');
  });

  it.each([
    ['abc', 'Ожидались три сегмента, разделённые точкой. Найдено сегментов: 1'],
    ['a.b', 'Ожидались три сегмента, разделённые точкой. Найдено сегментов: 2'],
    ['a.b.c.d', 'Ожидались три сегмента, разделённые точкой. Найдено сегментов: 4'],
    ['@@@.e30.x', 'header: некорректный base64url'],
    [`${b64url('{"alg":"HS256"')}.e30.x`, 'header — не JSON: Структура не закрыта: не хватает }'],
    [`${b64url('[1]')}.e30.x`, 'header — не JSON-объект'],
    [`${b64url('{"typ":"JWT"}')}.e30.x`, 'В header нет поля alg'],
    [`${b64url('{"alg":"HS256"}')}.${b64url('nope')}.x`, 'payload — не JSON: Ожидалось значение'],
  ])('ошибка: %s', (token, message) => {
    const result = decodeJwt(token);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.startsWith(message)).toBe(true);
  });

  it('нет exp — не ошибка', async () => {
    const token = await sign({ alg: 'HS256' }, '{"sub":"x"}', 'k');
    expect(decoded(token).claims).toEqual([]);
  });

  it('base64url без выравнивания и с - _', () => {
    expect(base64UrlToBytes('-_8')).toEqual(new Uint8Array([0xfb, 0xff]));
    expect(base64UrlToBytes('a')).toBeNull();
    expect(base64UrlToBytes('a+b')).toBeNull();
  });
});

describe('подпись', () => {
  it('пример подписан ключом dokey-example-key', async () => {
    expect(await verifyHmac(decoded(EXAMPLE), 'SHA-256', 'dokey-example-key')).toBe(true);
    expect(await verifyHmac(decoded(EXAMPLE), 'SHA-256', 'wrong')).toBe(false);
  });

  it.each([
    ['HS384', 'SHA-384'],
    ['HS512', 'SHA-512'],
  ])('%s проверяется своим хешем', async (alg, hash) => {
    const token = decoded(await sign({ alg }, '{}', 'secret', hash));
    expect(verifiability(alg)).toEqual({ kind: 'hmac', hash });
    expect(await verifyHmac(token, hash, 'secret')).toBe(true);
  });

  it('подменённый payload не проходит', async () => {
    const token = await sign({ alg: 'HS256' }, '{"role":"reader"}', 'k');
    const [h, , s] = token.split('.');
    const forged = `${h}.${b64url('{"role":"admin"}')}.${s}`;
    expect(await verifyHmac(decoded(forged), 'SHA-256', 'k')).toBe(false);
  });

  it('alg none, асимметричные и неизвестные алгоритмы не проверяются', () => {
    expect(verifiability('none').kind).toBe('none');
    expect(verifiability('RS256')).toMatchObject({ kind: 'public-key' });
    expect(verifiability('ES256').kind).toBe('public-key');
    expect(verifiability('XYZ').kind).toBe('unknown');
  });
});

describe('время', () => {
  it('UTC-формат', () => {
    expect(formatInstant(1767236400, 'UTC')).toBe('1 января 2026, 03:00 UTC');
  });

  it('относительное время', () => {
    expect(relative(1767236400, 1767236400 + 4 * 3600)).toBe('4 часа назад');
    expect(relative(1767236400 + 3 * 86400, 1767236400)).toBe('через 3 дня');
  });

  it('метки exp/nbf/iat', () => {
    const now = 1767236400 + 4 * 3600;
    expect(claimLabel({ name: 'exp', seconds: 1767236400 }, now)).toBe(
      'Истёк · 1 января 2026, 03:00 UTC · 4 часа назад',
    );
    expect(claimLabel({ name: 'exp', seconds: now + 60 }, now)).toMatch(
      /^Действует до · .* · через 1 минуту$/,
    );
    expect(claimLabel({ name: 'nbf', seconds: now + 60 }, now)).toMatch(/^Ещё не действует/);
    expect(claimLabel({ name: 'iat', seconds: now }, now)).toMatch(/^Выпущен/);
  });
});
