// UUID/ULID Generator: генерация v4, v7 (RFC 9562) и ULID, разбор и проверка.
// Случайность — только crypto.getRandomValues; Math.random здесь не встречается нигде.

export type Kind = 'v4' | 'v7' | 'ulid';

/** Порог пакета: больше — отказ с объяснением. */
export const MAX_BATCH = 1000;

export type RandomFill = (bytes: Uint8Array<ArrayBuffer>) => void;

const HEX = '0123456789abcdef';

function hex(bytes: Uint8Array): string {
  let out = '';
  for (const b of bytes) out += HEX[b >> 4]! + HEX[b & 15]!;
  return out;
}

export function formatUuid(bytes: Uint8Array): string {
  const h = hex(bytes);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function uuidV4(fill: RandomFill): string {
  const b = new Uint8Array(16);
  fill(b);
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  return formatUuid(b);
}

/** Состояние монотонности v7: 12 бит rand_a — счётчик внутри миллисекунды (RFC 9562, 6.2, метод 1). */
interface V7State {
  ms: number;
  seq: number;
}

function uuidV7(fill: RandomFill, now: number, state: V7State): string {
  let ms = Math.max(now, state.ms);
  let seq: number;
  if (ms === state.ms) {
    seq = state.seq + 1;
    if (seq > 0xfff) {
      ms += 1; // счётчик исчерпан — заимствуем следующую миллисекунду
      seq = 0;
    }
  } else {
    const r = new Uint8Array(2);
    fill(r);
    seq = ((r[0]! << 8) | r[1]!) & 0x7ff; // старт в нижней половине — запас под инкремент
  }
  state.ms = ms;
  state.seq = seq;

  const b = new Uint8Array(16);
  fill(b);
  let t = ms;
  for (let i = 5; i >= 0; i -= 1) {
    b[i] = t % 256;
    t = Math.floor(t / 256);
  }
  b[6] = 0x70 | (seq >> 8);
  b[7] = seq & 0xff;
  b[8] = (b[8]! & 0x3f) | 0x80;
  return formatUuid(b);
}

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** Состояние монотонности ULID: в той же миллисекунде случайная часть +1. */
interface UlidState {
  ms: number;
  random: Uint8Array;
}

function encodeUlid(ms: number, random: Uint8Array): string {
  let time = '';
  let t = ms;
  for (let i = 0; i < 10; i += 1) {
    time = CROCKFORD[t % 32]! + time;
    t = Math.floor(t / 32);
  }
  // 80 бит случайной части → 16 символов по 5 бит.
  let bits = 0n;
  for (const byte of random) bits = (bits << 8n) | BigInt(byte);
  let rand = '';
  for (let i = 0; i < 16; i += 1) {
    rand = CROCKFORD[Number(bits & 31n)]! + rand;
    bits >>= 5n;
  }
  return time + rand;
}

function ulid(fill: RandomFill, now: number, state: UlidState): string {
  if (now <= state.ms && state.random.length === 10) {
    // Инкремент 80-битного числа; переполнение — исключительный случай (2^80 значений за мс).
    const random = state.random;
    let i = 9;
    while (i >= 0 && random[i] === 0xff) {
      random[i] = 0;
      i -= 1;
    }
    if (i < 0) throw new Error('ULID: случайная часть исчерпана в пределах миллисекунды');
    random[i] = random[i]! + 1;
    return encodeUlid(state.ms, random);
  }
  const random = new Uint8Array(10);
  fill(random);
  state.ms = now;
  state.random = random;
  return encodeUlid(now, random);
}

export interface Generator {
  next(kind: Kind): string;
}

export function createGenerator(fill: RandomFill, clock: () => number = Date.now): Generator {
  const v7: V7State = { ms: -1, seq: 0 };
  const ul: UlidState = { ms: -1, random: new Uint8Array(0) };
  return {
    next(kind) {
      if (kind === 'v4') return uuidV4(fill);
      if (kind === 'v7') return uuidV7(fill, clock(), v7);
      return ulid(fill, clock(), ul);
    },
  };
}

export type CountResult = { ok: true; count: number } | { ok: false; error: string };

export function parseCount(input: string): CountResult {
  const text = input.trim();
  if (!/^\d+$/.test(text) || Number(text) < 1 || Number(text) > MAX_BATCH) {
    return { ok: false, error: `Количество — целое число от 1 до ${MAX_BATCH}` };
  }
  return { ok: true, count: Number(text) };
}

// --- Разбор ---

export interface Field {
  name: string;
  value: string;
}

export type InspectResult = { ok: true; fields: Field[] } | { ok: false; error: string };

const GREGORIAN_OFFSET_MS = 12219292800000; // 1582-10-15 → 1970-01-01

function variantOf(nibble: number): string {
  if (nibble < 8) return 'NCS (устаревший)';
  if (nibble < 12) return 'RFC 9562';
  if (nibble < 14) return 'Microsoft (устаревший)';
  return 'Зарезервирован';
}

function isoTime(ms: number): string {
  return Number.isFinite(ms) && Math.abs(ms) <= 8.64e15 ? new Date(ms).toISOString() : '';
}

function inspectUuid(compact: string, offsets: number[]): InspectResult {
  for (let i = 0; i < compact.length; i += 1) {
    if (!HEX.includes(compact[i]!)) {
      return { ok: false, error: `Недопустимый символ на позиции ${offsets[i]! + 1}` };
    }
  }
  if (compact.length !== 32) {
    return {
      ok: false,
      error: `Ожидалось 32 шестнадцатеричные цифры, найдено ${compact.length}`,
    };
  }
  const canonical = `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`;
  if (/^0+$/.test(compact)) {
    return {
      ok: true,
      fields: [
        { name: 'Формат', value: 'UUID, Nil' },
        { name: 'Запись', value: canonical },
      ],
    };
  }
  if (/^f+$/.test(compact)) {
    return {
      ok: true,
      fields: [
        { name: 'Формат', value: 'UUID, Max' },
        { name: 'Запись', value: canonical },
      ],
    };
  }
  const version = Number.parseInt(compact[12]!, 16);
  const variantNibble = Number.parseInt(compact[16]!, 16);
  const fields: Field[] = [
    { name: 'Формат', value: 'UUID' },
    { name: 'Версия', value: String(version) },
    { name: 'Вариант', value: variantOf(variantNibble) },
  ];
  const rfc = variantNibble >= 8 && variantNibble < 12;
  let ms = Number.NaN;
  if (rfc && version === 7) ms = Number.parseInt(compact.slice(0, 12), 16);
  if (rfc && (version === 1 || version === 6)) {
    const ticks =
      version === 1
        ? BigInt(`0x${compact.slice(13, 16)}${compact.slice(8, 12)}${compact.slice(0, 8)}`)
        : BigInt(`0x${compact.slice(0, 12)}${compact.slice(13, 16)}`);
    ms = Number(ticks / 10000n) - GREGORIAN_OFFSET_MS;
  }
  const time = isoTime(ms);
  if (time) fields.push({ name: 'Время', value: time });
  if (!rfc || version < 1 || version > 8) {
    fields.push({ name: 'Замечание', value: 'Версия или вариант вне RFC 9562' });
  }
  fields.push({ name: 'Запись', value: canonical });
  return { ok: true, fields };
}

function inspectUlid(text: string): InspectResult {
  const upper = text.toUpperCase();
  for (let i = 0; i < upper.length; i += 1) {
    if (!CROCKFORD.includes(upper[i]!)) {
      return { ok: false, error: `Недопустимый символ ULID на позиции ${i + 1}` };
    }
  }
  if (upper[0]! > '7') {
    return { ok: false, error: 'ULID вне диапазона: первый символ должен быть от 0 до 7' };
  }
  let ms = 0;
  for (const ch of upper.slice(0, 10)) ms = ms * 32 + CROCKFORD.indexOf(ch);
  return {
    ok: true,
    fields: [
      { name: 'Формат', value: 'ULID' },
      { name: 'Время', value: isoTime(ms) },
      { name: 'Запись', value: upper },
    ],
  };
}

/** Принимает UUID в любой обычной записи (дефисы, скобки, urn:uuid:, регистр) и ULID. */
export function inspect(input: string): InspectResult {
  const trimmed = input.trim();
  if (trimmed === '') return { ok: false, error: 'Вставьте UUID или ULID' };
  const lead = input.indexOf(trimmed);
  if (trimmed.length === 26 && !trimmed.includes('-')) return inspectUlid(trimmed);

  let body = trimmed;
  let start = lead;
  const urn = /^urn:uuid:/i.exec(body);
  if (urn) {
    body = body.slice(urn[0].length);
    start += urn[0].length;
  }
  if (body.startsWith('{') && body.endsWith('}')) {
    body = body.slice(1, -1);
    start += 1;
  }
  let compact = '';
  const offsets: number[] = [];
  for (let i = 0; i < body.length; i += 1) {
    if (body[i] === '-') continue;
    compact += body[i]!.toLowerCase();
    offsets.push(start + i);
  }
  return inspectUuid(compact, offsets);
}
