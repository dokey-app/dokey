// Unix Timestamp Converter: секунды и миллисекунды ↔ ISO 8601, UTC и местное время.
// Здесь же — общие для инструментов правила вывода времени (их берёт и JWT Inspector):
// ни одно время не показывается без зоны, метаданные — по-русски, числа — без разрядов.

export type Unit = 's' | 'ms';

/** Диапазон ISO 8601 с четырёхзначным годом: 0001-01-01 … 9999-12-31. */
const MIN_MS = -62135596800000;
const MAX_MS = 253402300799999;

export type Parsed =
  | { ok: true; ms: number; source: 'number'; unit: Unit }
  | { ok: true; ms: number; source: 'iso'; zoneAssumed: boolean }
  | { ok: false; error: string };

const NUMBER = /^-?\d+(\.\d+)?$/;
const ISO =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(\.\d{1,9})?)?)?(Z|[+-]\d{2}:?\d{2})?$/i;

const OUT_OF_RANGE = 'Значение вне диапазона: ожидались секунды или миллисекунды Unix-времени';

/** 10 цифр — секунды, 13 — миллисекунды: до 11 цифр — секунды, 12–14 — миллисекунды. */
export function detectUnit(text: string): Unit | null {
  const trimmed = text.trim();
  if (!NUMBER.test(trimmed)) return null;
  const digits = trimmed.replace(/^-/, '').split('.')[0]!.length;
  if (digits <= 11) return 's';
  if (digits <= 14) return 'ms';
  return null;
}

function parseIso(match: RegExpExecArray): Parsed {
  const [, y, mo, d, h = '0', mi = '0', s = '0', fraction = '', zone] = match;
  const [year, month, day, hour, minute, second] = [y, mo, d, h, mi, s].map(Number) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const millis = Number((fraction.slice(1) + '000').slice(0, 3));
  const utc = Date.UTC(year, month - 1, day, hour, minute, second, millis);
  const back = new Date(utc);
  // Date.UTC молча переносит 31 февраля в март — сверяем компоненты обратно.
  if (
    back.getUTCFullYear() !== year ||
    back.getUTCMonth() !== month - 1 ||
    back.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return { ok: false, error: 'Некорректная дата: проверьте месяц, день и время' };
  }
  let offsetMinutes = 0;
  if (zone && zone.toUpperCase() !== 'Z') {
    const sign = zone.startsWith('-') ? -1 : 1;
    const digits = zone.slice(1).replace(':', '');
    offsetMinutes = sign * (Number(digits.slice(0, 2)) * 60 + Number(digits.slice(2)));
  }
  const ms = utc - offsetMinutes * 60_000;
  if (ms < MIN_MS || ms > MAX_MS) return { ok: false, error: OUT_OF_RANGE };
  return { ok: true, ms, source: 'iso', zoneAssumed: !zone };
}

export function parseTimestamp(input: string, unitOverride: Unit | null = null): Parsed {
  const text = input.trim();
  const iso = ISO.exec(text);
  if (iso) return parseIso(iso);
  if (!NUMBER.test(text)) {
    return {
      ok: false,
      error: 'Ожидалось число секунд или миллисекунд Unix-времени либо дата ISO 8601',
    };
  }
  const unit = unitOverride ?? detectUnit(text);
  if (!unit) return { ok: false, error: OUT_OF_RANGE };
  const value = Number(text);
  const ms = Math.round(unit === 's' ? value * 1000 : value);
  if (!Number.isFinite(ms) || ms < MIN_MS || ms > MAX_MS) return { ok: false, error: OUT_OF_RANGE };
  return { ok: true, ms, source: 'number', unit };
}

// --- Вывод времени ---

export function utcOffset(date: Date): string {
  const minutes = -date.getTimezoneOffset();
  if (minutes === 0) return 'UTC';
  const sign = minutes > 0 ? '+' : '−';
  const abs = Math.abs(minutes);
  const hh = Math.floor(abs / 60);
  const mm = abs % 60;
  return `UTC${sign}${hh}${mm ? `:${String(mm).padStart(2, '0')}` : ''}`;
}

/** «1 января 2026, 03:00 UTC»; без timeZone — местное время со смещением. */
export function formatInstant(
  seconds: number,
  timeZone: 'UTC' | undefined,
  withSeconds = false,
): string {
  const date = new Date(seconds * 1000);
  const parts = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {}),
    hourCycle: 'h23',
    ...(timeZone ? { timeZone } : {}),
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '';
  const time = `${get('hour')}:${get('minute')}${withSeconds ? `:${get('second')}` : ''}`;
  const zone = timeZone ?? utcOffset(date);
  return `${get('day')} ${get('month')} ${get('year')}, ${time} ${zone}`;
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
];

/** «4 часа назад», «через 3 дня». */
export function relative(seconds: number, nowSeconds: number): string {
  const diff = seconds - nowSeconds;
  const [unit, size] = UNITS.find(([, s]) => Math.abs(diff) >= s) ?? ['second', 1];
  return new Intl.RelativeTimeFormat('ru', { numeric: 'always' }).format(
    Math.trunc(diff / size),
    unit,
  );
}

const pad = (n: number, width = 2): string => String(Math.abs(n)).padStart(width, '0');

/** ISO 8601 в местной зоне со смещением: 2026-01-01T06:00:00+03:00. */
export function isoLocal(ms: number): string {
  const d = new Date(ms);
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const fraction = d.getMilliseconds() ? `.${pad(d.getMilliseconds(), 3)}` : '';
  return (
    `${pad(d.getFullYear(), 4)}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${fraction}` +
    `${sign}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`
  );
}

export interface Row {
  name: string;
  value: string;
}

/**
 * Представления момента. Местное время и «относительно сейчас» зависят от браузера, поэтому
 * на сборке (local = false, now = null) их нет — их досчитывает ui.ts.
 */
export function rows(ms: number, local: boolean, nowMs: number | null): Row[] {
  const seconds = ms / 1000;
  const list: Row[] = [
    { name: 'Секунды', value: String(Math.floor(seconds)) },
    { name: 'Миллисекунды', value: String(ms) },
    { name: 'ISO 8601, UTC', value: new Date(ms).toISOString() },
    { name: 'UTC', value: formatInstant(seconds, 'UTC', true) },
  ];
  if (local) {
    list.push(
      { name: 'Местное время', value: formatInstant(seconds, undefined, true) },
      { name: 'ISO 8601, местное', value: isoLocal(ms) },
    );
  }
  if (nowMs !== null) {
    list.push({ name: 'Относительно сейчас', value: relative(seconds, nowMs / 1000) });
  }
  return list;
}

/** Синтетический пример до первого ввода: 1 января 2026, 03:00 UTC. */
export const EXAMPLE = '1767236400';
