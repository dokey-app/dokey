// Base64 Encoder/Decoder: текст в UTF-8 и файлы, стандартный и URL-safe алфавит.

export const SOFT_LIMIT_BYTES = 2_000_000;
export const HARD_LIMIT_BYTES = 10_000_000;
/** Размер порции чтения файла: кратен 3, поэтому base64 порций склеивается без стыков. */
export const FILE_CHUNK = 3 * 1024 * 1024;

export function encodeBytes(bytes: Uint8Array, urlSafe: boolean): string {
  let binary = '';
  // String.fromCharCode с огромным числом аргументов переполняет стек — порциями.
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  const b64 = btoa(binary);
  return urlSafe ? b64.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '') : b64;
}

export function utf8Length(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function encodeText(text: string, urlSafe: boolean): string {
  return encodeBytes(new TextEncoder().encode(text), urlSafe);
}

export type DecodeResult =
  { ok: true; bytes: Uint8Array<ArrayBuffer> } | { ok: false; error: string };

const ALPHABET = /[A-Za-z0-9+/\-_]/;

/**
 * Принимает оба алфавита, пробелы и переводы строк (как в PEM и MIME), паддинг — по желанию.
 * Позиция в ошибке — в исходном вводе, сам ввод не цитируется.
 */
export function decodeBase64(input: string): DecodeResult {
  let clean = '';
  let padding = 0;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i]!;
    if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') continue;
    if (ch === '=') {
      padding += 1;
      if (padding > 2) {
        return {
          ok: false,
          error: `Некорректная base64-строка: лишний знак = на позиции ${i + 1}`,
        };
      }
      continue;
    }
    if (padding > 0 || !ALPHABET.test(ch)) {
      return {
        ok: false,
        error: `Некорректная base64-строка: недопустимый символ на позиции ${i + 1}`,
      };
    }
    clean += ch;
  }
  if (clean.length === 0) return { ok: false, error: 'Некорректная base64-строка: она пустая' };
  if ((clean.length + padding) % 4 === 1 || (padding > 0 && (clean.length + padding) % 4 !== 0)) {
    return {
      ok: false,
      error:
        'Некорректная base64-строка: длина не кратна четырём. Возможно, при копировании потерялся хвост',
    };
  }
  const b64 = clean.replaceAll('-', '+').replaceAll('_', '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return { ok: true, bytes };
}

export type Content = { kind: 'text'; text: string } | { kind: 'binary' };

/** Текст — валидный UTF-8 без управляющих символов, кроме \t \n \r. */
export function classify(bytes: Uint8Array): Content {
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return { kind: 'binary' };
  }
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) return { kind: 'binary' };
  return { kind: 'text', text };
}

/** Похоже на base64, который стоит декодировать: декодируется в текст. */
export function looksLikeBase64(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.length < 4) return false;
  const decoded = decodeBase64(trimmed);
  return decoded.ok && decoded.bytes.length > 0 && classify(decoded.bytes).kind === 'text';
}

export function hexPreview(bytes: Uint8Array, limit = 256): string {
  const lines: string[] = [];
  const end = Math.min(bytes.length, limit);
  for (let offset = 0; offset < end; offset += 16) {
    const row = [...bytes.subarray(offset, Math.min(offset + 16, end))]
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ');
    lines.push(`${offset.toString(16).padStart(8, '0')}  ${row}`);
  }
  if (bytes.length > limit) lines.push('…');
  return lines.join('\n');
}

const sizeFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });

/** Десятичные единицы: 840 Б, 12 КБ, 1,4 МБ. */
export function formatSize(bytes: number): string {
  if (bytes < 1000) return `${bytes} Б`;
  if (bytes < 1_000_000) return `${sizeFormat.format(bytes / 1000)} КБ`;
  return `${sizeFormat.format(bytes / 1_000_000)} МБ`;
}

/** Синтетический пример до первого ввода. */
export const EXAMPLE = 'Привет, DoKey! Ввод не покидает вкладку.';
