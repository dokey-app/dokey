// JWT Inspector: разбор header/payload, метки времени exp/iat/nbf, проверка HMAC-подписи
// через WebCrypto. Алгоритм берётся из `alg` и никогда не подменяется.

import { describeError, parseJson, stringify, type JsonNode } from '../json/logic.ts';

export type Segment = 'header' | 'payload';

export interface DecodedJwt {
  /** Отформатированный JSON — числа в исходной записи. */
  header: string;
  payload: string;
  signature: string;
  alg: string;
  claims: Claim[];
  /** header.payload в исходной записи — то, что подписано. */
  signingInput: string;
}

export interface Claim {
  name: 'exp' | 'iat' | 'nbf';
  /** Секунды Unix. */
  seconds: number;
}

export type DecodeResult = { ok: true; value: DecodedJwt } | { ok: false; error: string };

const B64URL = /^[A-Za-z0-9_-]*$/;

export function base64UrlToBytes(segment: string): Uint8Array<ArrayBuffer> | null {
  if (!B64URL.test(segment) || segment.length % 4 === 1) return null;
  const b64 = segment.replaceAll('-', '+').replaceAll('_', '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  try {
    return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

function decodeSegment(
  name: Segment,
  segment: string,
): { ok: true; node: JsonNode; text: string } | { ok: false; error: string } {
  const bytes = base64UrlToBytes(segment);
  if (!bytes) return { ok: false, error: `${name}: некорректный base64url` };
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return { ok: false, error: `${name}: после декодирования — не текст UTF-8` };
  }
  const parsed = parseJson(text);
  if (!parsed.ok) return { ok: false, error: `${name} — не JSON: ${describeError(parsed.error)}` };
  if (parsed.value.kind !== 'object') return { ok: false, error: `${name} — не JSON-объект` };
  return { ok: true, node: parsed.value, text };
}

function field(node: JsonNode, key: string): JsonNode | undefined {
  return node.kind === 'object' ? node.entries.findLast((e) => e.key === key)?.value : undefined;
}

export function decodeJwt(input: string): DecodeResult {
  const token = input.trim().replace(/^Bearer\s+/i, '');
  const parts = token.split('.');
  if (parts.length !== 3) {
    return {
      ok: false,
      error: `Ожидались три сегмента, разделённые точкой. Найдено сегментов: ${parts.length}`,
    };
  }
  const [rawHeader, rawPayload, signature] = parts as [string, string, string];
  const header = decodeSegment('header', rawHeader);
  if (!header.ok) return header;
  const payload = decodeSegment('payload', rawPayload);
  if (!payload.ok) return payload;

  const alg = field(header.node, 'alg');
  if (alg?.kind !== 'string') return { ok: false, error: 'В header нет поля alg' };

  const claims: Claim[] = [];
  for (const name of ['exp', 'iat', 'nbf'] as const) {
    const value = field(payload.node, name);
    if (value?.kind === 'number' && Number.isFinite(Number(value.raw))) {
      claims.push({ name, seconds: Number(value.raw) });
    }
  }

  const pretty = { indent: 2, sortKeys: false };
  return {
    ok: true,
    value: {
      header: stringify(header.node, pretty),
      payload: stringify(payload.node, pretty),
      signature,
      alg: alg.value,
      claims,
      signingInput: `${rawHeader}.${rawPayload}`,
    },
  };
}

// --- Подпись ---

const HMAC_HASH: Record<string, string> = {
  HS256: 'SHA-256',
  HS384: 'SHA-384',
  HS512: 'SHA-512',
};

export type Verifiability =
  | { kind: 'hmac'; hash: string }
  | { kind: 'none'; message: string }
  | { kind: 'public-key'; message: string }
  | { kind: 'unknown'; message: string };

export function verifiability(alg: string): Verifiability {
  const hash = HMAC_HASH[alg];
  if (hash) return { kind: 'hmac', hash };
  if (alg.toLowerCase() === 'none') {
    return {
      kind: 'none',
      message: 'Токен не подписан (alg: none). Подтвердить его подлинность нечем.',
    };
  }
  if (/^(RS|PS|ES)\d+$|^EdDSA$/.test(alg)) {
    return {
      kind: 'public-key',
      message: `Подпись ${alg} локально не проверяется — нужен открытый ключ. header и payload разобраны`,
    };
  }
  return { kind: 'unknown', message: `Алгоритм ${alg} не поддерживается для проверки подписи` };
}

/** true — подпись совпала. Ключ — текст в UTF-8, как его передают библиотеки по умолчанию. */
export async function verifyHmac(token: DecodedJwt, hash: string, key: string): Promise<boolean> {
  const signature = base64UrlToBytes(token.signature);
  if (!signature) return false;
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(key);
  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash }, false, [
    'verify',
  ]);
  keyBytes.fill(0);
  return crypto.subtle.verify('HMAC', cryptoKey, signature, encoder.encode(token.signingInput));
}

// --- Время ---

export function formatInstant(seconds: number, timeZone: 'UTC' | undefined): string {
  const date = new Date(seconds * 1000);
  const parts = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    ...(timeZone ? { timeZone } : {}),
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '';
  const zone = timeZone ?? utcOffset(date);
  return `${get('day')} ${get('month')} ${get('year')}, ${get('hour')}:${get('minute')} ${zone}`;
}

function utcOffset(date: Date): string {
  const minutes = -date.getTimezoneOffset();
  if (minutes === 0) return 'UTC';
  const sign = minutes > 0 ? '+' : '−';
  const abs = Math.abs(minutes);
  const hh = Math.floor(abs / 60);
  const mm = abs % 60;
  return `UTC${sign}${hh}${mm ? `:${String(mm).padStart(2, '0')}` : ''}`;
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
];

export function relative(seconds: number, nowSeconds: number): string {
  const diff = seconds - nowSeconds;
  const [unit, size] = UNITS.find(([, s]) => Math.abs(diff) >= s) ?? ['second', 1];
  return new Intl.RelativeTimeFormat('ru', { numeric: 'always' }).format(
    Math.trunc(diff / size),
    unit,
  );
}

/** Метка claim: «Истёк · 1 января 2026, 03:00 UTC · 4 часа назад». */
export function claimLabel(claim: Claim, nowSeconds: number): string {
  const past = claim.seconds <= nowSeconds;
  const verb =
    claim.name === 'exp'
      ? past
        ? 'Истёк'
        : 'Действует до'
      : claim.name === 'nbf'
        ? past
          ? 'Действует с'
          : 'Ещё не действует'
        : 'Выпущен';
  return `${verb} · ${formatInstant(claim.seconds, 'UTC')} · ${relative(claim.seconds, nowSeconds)}`;
}

/** Синтетический пример: HS256, ключ `dokey-example-key`. */
export const EXAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTQyIiwibmFtZSI6IkFubiBFeGFtcGxlIiwicm9sZSI6InJlYWRlciIsImlhdCI6MTc2NzIyNTYwMCwiZXhwIjoxNzY3MjM2NDAwfQ._jASEigTDU_Ncikc1XQfdaBftTU4GXDmD8AJNYTOVsA';
