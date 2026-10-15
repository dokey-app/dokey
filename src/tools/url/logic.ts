// URL Encoder/Decoder: percent-кодирование, разбор URL на компоненты, таблица query.

export type Mode = 'parse' | 'decode' | 'encode';

/** Схемы, для которых разбор на хост, путь и query имеет смысл. */
export const KNOWN_SCHEMES = new Set(['http', 'https', 'ws', 'wss', 'ftp', 'file']);

export type DecodeResult = { ok: true; text: string } | { ok: false; error: string };

const HEX = /^[0-9a-fA-F]{2}$/;
const utf8 = new TextDecoder('utf-8', { fatal: true });

/**
 * Строгое percent-декодирование: оборванная %-последовательность и байты, не складывающиеся
 * в UTF-8, — ошибка с позицией (1-based), а не молчаливая замена. «+» остаётся «+».
 */
export function percentDecode(input: string): DecodeResult {
  let out = '';
  let i = 0;
  while (i < input.length) {
    if (input[i] !== '%') {
      const next = input.indexOf('%', i);
      const end = next === -1 ? input.length : next;
      out += input.slice(i, end);
      i = end;
      continue;
    }
    const runStart = i;
    const bytes: number[] = [];
    while (input[i] === '%') {
      const hex = input.slice(i + 1, i + 3);
      if (!HEX.test(hex)) {
        return { ok: false, error: `Оборванная percent-последовательность на позиции ${i + 1}` };
      }
      bytes.push(Number.parseInt(hex, 16));
      i += 3;
    }
    try {
      out += utf8.decode(new Uint8Array(bytes));
    } catch {
      return {
        ok: false,
        error: `Percent-последовательность на позиции ${runStart + 1} не складывается в символ UTF-8`,
      };
    }
  }
  return { ok: true, text: out };
}

/** Кодирование как компонента URL (encodeURIComponent). */
export function percentEncode(text: string): DecodeResult {
  try {
    return { ok: true, text: encodeURIComponent(text) };
  } catch {
    return {
      ok: false,
      error: 'Текст содержит непарный суррогат UTF-16 — его нельзя закодировать',
    };
  }
}

export interface Component {
  name: string;
  value: string;
}

export interface QueryRow {
  /** Пара в исходной записи: `q=%D0%BF`. */
  raw: string;
  key: string;
  value: string;
}

export type ParseResult =
  | { ok: true; href: string; components: Component[]; query: QueryRow[] }
  | { ok: false; error: string };

const SCHEME = /^([a-zA-Z][a-zA-Z0-9+.-]*):/;
/** Похоже на адрес без схемы: example.com, api.example.com:8080/path, localhost:3000. */
const SCHEMELESS = /^(localhost|[\w-]+(\.[\w-]+)+)(:\d+)?([/?#]|$)/;

/** Значение query: «+» — пробел (application/x-www-form-urlencoded); битое — как есть. */
function decodeQueryPart(part: string): string {
  const decoded = percentDecode(part.replaceAll('+', ' '));
  return decoded.ok ? decoded.text : part;
}

export function parseQuery(search: string): QueryRow[] {
  const body = search.startsWith('?') ? search.slice(1) : search;
  if (body === '') return [];
  return body
    .split('&')
    .filter((raw) => raw !== '')
    .map((raw) => {
      const eq = raw.indexOf('=');
      const key = eq === -1 ? raw : raw.slice(0, eq);
      const value = eq === -1 ? '' : raw.slice(eq + 1);
      return { raw, key: decodeQueryPart(key), value: decodeQueryPart(value) };
    });
}

function decodedIfDifferent(value: string): string {
  const decoded = percentDecode(value);
  return decoded.ok && decoded.text !== value ? decoded.text : '';
}

export function parseUrl(input: string): ParseResult {
  const text = input.trim();
  const scheme = SCHEME.exec(text)?.[1]?.toLowerCase();
  if (!scheme) {
    return { ok: false, error: 'Некорректный URL: нет схемы. Добавьте https:// в начало' };
  }
  if (!KNOWN_SCHEMES.has(scheme)) {
    return {
      ok: false,
      error: 'Эта схема не разбирается — поддерживаются http, https, ws, wss, ftp, file',
    };
  }
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return { ok: false, error: 'Некорректный URL: проверьте хост и порт' };
  }
  const components: Component[] = [
    { name: 'Схема', value: scheme },
    { name: 'Пользователь', value: url.username },
    { name: 'Пароль', value: url.password },
    { name: 'Хост', value: url.hostname },
    { name: 'Порт', value: url.port },
    { name: 'Путь', value: url.pathname },
    { name: 'Путь, декодирован', value: decodedIfDifferent(url.pathname) },
    { name: 'Query', value: url.search.slice(1) },
    { name: 'Фрагмент', value: url.hash.slice(1) },
  ].filter((c) => c.value !== '');
  return { ok: true, href: url.href, components, query: parseQuery(url.search) };
}

/** Режим по вводу: полный URL — разбор, есть %XX — декодирование, похоже на адрес — разбор. */
export function detectMode(input: string): Mode {
  const text = input.trim();
  const scheme = SCHEME.exec(text)?.[1]?.toLowerCase();
  if (scheme && KNOWN_SCHEMES.has(scheme) && text.slice(scheme.length + 1).startsWith('//')) {
    return 'parse';
  }
  if (/%[0-9a-fA-F]{2}/.test(text)) return 'decode';
  if (SCHEMELESS.test(text)) return 'parse';
  return 'encode';
}

/** Синтетический пример до первого ввода. */
export const EXAMPLE =
  'https://api.example.com:8443/v1/search?q=%D0%BF%D1%80%D0%B8%D0%B2%D0%B5%D1%82&tag=json&tag=jwt&page=2#results';
