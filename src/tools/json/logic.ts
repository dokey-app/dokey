// JSON Workbench: разбор по RFC 8259, форматирование, минификация, сортировка ключей.
//
// Свой разборщик вместо JSON.parse: JSON.parse + stringify переписывают числа
// (12345678901234567890 → 12345678901234567000, 1.0 → 1, 1e7 → 10000000) и не говорят,
// что именно не так. Здесь числа и строки хранят исходную запись, а ошибка несёт причину
// и смещение.

export type JsonNode =
  | { kind: 'object'; entries: JsonEntry[] }
  | { kind: 'array'; items: JsonNode[] }
  | { kind: 'string'; raw: string; value: string }
  | { kind: 'number'; raw: string }
  | { kind: 'literal'; raw: 'true' | 'false' | 'null' };

export interface JsonEntry {
  /** Ключ в исходной записи, с кавычками и escape-последовательностями. */
  raw: string;
  /** Декодированный ключ. */
  key: string;
  value: JsonNode;
}

export interface JsonError {
  message: string;
  /** Смещение в символах (UTF-16) от начала ввода. */
  offset: number;
  line: number;
  column: number;
}

export type ParseResult = { ok: true; value: JsonNode } | { ok: false; error: JsonError };

/** Глубже — отказ с объяснением: глубокая вложенность кладёт вкладку при отрисовке. */
export const MAX_DEPTH = 1000;
/** Пороги размера ввода в байтах UTF-8 (десятичные МБ). */
export const SOFT_LIMIT_BYTES = 2_000_000;
export const HARD_LIMIT_BYTES = 10_000_000;

class Fail extends Error {
  readonly reason: string;
  readonly offset: number;

  constructor(reason: string, offset: number) {
    super(reason);
    this.reason = reason;
    this.offset = offset;
  }
}

const WS = new Set([0x20, 0x09, 0x0a, 0x0d]);
const ESCAPES: Record<string, string> = {
  '"': '"',
  '\\': '\\',
  '/': '/',
  b: '\b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t',
};

class Parser {
  private pos = 0;

  private readonly src: string;

  constructor(src: string) {
    this.src = src;
  }

  parse(): JsonNode {
    this.skipWs();
    if (this.pos >= this.src.length) throw new Fail('Ожидалось значение', this.pos);
    const value = this.value(0);
    this.skipWs();
    if (this.pos < this.src.length) {
      throw new Fail('Лишние данные после конца документа', this.pos);
    }
    return value;
  }

  private skipWs(): void {
    while (this.pos < this.src.length && WS.has(this.src.charCodeAt(this.pos))) this.pos += 1;
  }

  private value(depth: number): JsonNode {
    const ch = this.src[this.pos];
    if (ch === '{') return this.object(depth + 1);
    if (ch === '[') return this.array(depth + 1);
    if (ch === '"') {
      const { raw, value } = this.string();
      return { kind: 'string', raw, value };
    }
    if (ch === '-' || (ch !== undefined && ch >= '0' && ch <= '9')) return this.number();
    for (const raw of ['true', 'false', 'null'] as const) {
      if (this.src.startsWith(raw, this.pos)) {
        this.pos += raw.length;
        return { kind: 'literal', raw };
      }
    }
    if (ch === undefined) throw new Fail('Ожидалось значение', this.pos);
    if (ch === "'")
      throw new Fail('Строки в JSON берутся в двойные кавычки, а не в одинарные', this.pos);
    throw new Fail('Ожидалось значение', this.pos);
  }

  private enter(depth: number): void {
    if (depth > MAX_DEPTH) {
      throw new Fail(
        `Вложенность глубже ${MAX_DEPTH} уровней — такой документ не обрабатывается`,
        this.pos,
      );
    }
    this.pos += 1;
    this.skipWs();
  }

  private object(depth: number): JsonNode {
    this.enter(depth);
    const entries: JsonEntry[] = [];
    if (this.src[this.pos] === '}') {
      this.pos += 1;
      return { kind: 'object', entries };
    }
    for (;;) {
      if (this.pos >= this.src.length)
        throw new Fail('Структура не закрыта: не хватает }', this.pos);
      if (this.src[this.pos] !== '"') {
        throw new Fail('Ожидалось имя поля в двойных кавычках', this.pos);
      }
      const { raw, value: key } = this.string();
      this.skipWs();
      if (this.src[this.pos] !== ':')
        throw new Fail('Ожидалось двоеточие после имени поля', this.pos);
      this.pos += 1;
      this.skipWs();
      const value = this.value(depth);
      entries.push({ raw, key, value });
      this.skipWs();
      const ch = this.src[this.pos];
      if (ch === '}') {
        this.pos += 1;
        return { kind: 'object', entries };
      }
      if (ch === undefined) throw new Fail('Структура не закрыта: не хватает }', this.pos);
      if (ch !== ',') throw new Fail('Ожидалась запятая', this.pos);
      const comma = this.pos;
      this.pos += 1;
      this.skipWs();
      if (this.src[this.pos] === '}') throw new Fail('Лишняя запятая перед }', comma);
    }
  }

  private array(depth: number): JsonNode {
    this.enter(depth);
    const items: JsonNode[] = [];
    if (this.src[this.pos] === ']') {
      this.pos += 1;
      return { kind: 'array', items };
    }
    for (;;) {
      if (this.pos >= this.src.length)
        throw new Fail('Структура не закрыта: не хватает ]', this.pos);
      items.push(this.value(depth));
      this.skipWs();
      const ch = this.src[this.pos];
      if (ch === ']') {
        this.pos += 1;
        return { kind: 'array', items };
      }
      if (ch === undefined) throw new Fail('Структура не закрыта: не хватает ]', this.pos);
      if (ch !== ',') throw new Fail('Ожидалась запятая', this.pos);
      const comma = this.pos;
      this.pos += 1;
      this.skipWs();
      if (this.src[this.pos] === ']') throw new Fail('Лишняя запятая перед ]', comma);
    }
  }

  private string(): { raw: string; value: string } {
    const start = this.pos;
    this.pos += 1;
    let value = '';
    let chunk = this.pos;
    for (;;) {
      if (this.pos >= this.src.length) throw new Fail('Строка не закрыта: не хватает "', start);
      const code = this.src.charCodeAt(this.pos);
      if (code === 0x22) {
        value += this.src.slice(chunk, this.pos);
        this.pos += 1;
        return { raw: this.src.slice(start, this.pos), value };
      }
      if (code < 0x20) {
        throw new Fail(
          code === 0x0a
            ? 'Перевод строки внутри строки — замените его на \\n'
            : 'Управляющий символ внутри строки',
          this.pos,
        );
      }
      if (code === 0x5c) {
        value += this.src.slice(chunk, this.pos);
        const esc = this.src[this.pos + 1];
        if (esc === 'u') {
          const hex = this.src.slice(this.pos + 2, this.pos + 6);
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
            throw new Fail(
              'Некорректная последовательность \\u: нужны четыре шестнадцатеричные цифры',
              this.pos,
            );
          }
          value += String.fromCharCode(Number.parseInt(hex, 16));
          this.pos += 6;
        } else if (esc !== undefined && esc in ESCAPES) {
          value += ESCAPES[esc];
          this.pos += 2;
        } else {
          throw new Fail('Некорректная escape-последовательность', this.pos);
        }
        chunk = this.pos;
        continue;
      }
      this.pos += 1;
    }
  }

  private number(): JsonNode {
    const start = this.pos;
    const digits = (): number => {
      const from = this.pos;
      while (this.pos < this.src.length) {
        const c = this.src.charCodeAt(this.pos);
        if (c < 0x30 || c > 0x39) break;
        this.pos += 1;
      }
      return this.pos - from;
    };
    if (this.src[this.pos] === '-') this.pos += 1;
    if (this.src[this.pos] === '0') {
      this.pos += 1;
      if (/[0-9]/.test(this.src[this.pos] ?? '')) {
        throw new Fail('Число не может начинаться с нуля', start);
      }
    } else if (digits() === 0) {
      throw new Fail('Некорректное число', start);
    }
    if (this.src[this.pos] === '.') {
      this.pos += 1;
      if (digits() === 0) throw new Fail('Некорректное число: после точки нужна цифра', start);
    }
    if (this.src[this.pos] === 'e' || this.src[this.pos] === 'E') {
      this.pos += 1;
      if (this.src[this.pos] === '+' || this.src[this.pos] === '-') this.pos += 1;
      if (digits() === 0) throw new Fail('Некорректное число: в экспоненте нужна цифра', start);
    }
    return { kind: 'number', raw: this.src.slice(start, this.pos) };
  }
}

export function locate(src: string, offset: number): { line: number; column: number } {
  let line = 1;
  let lineStart = 0;
  for (let i = src.indexOf('\n'); i !== -1 && i < offset; i = src.indexOf('\n', i + 1)) {
    line += 1;
    lineStart = i + 1;
  }
  return { line, column: offset - lineStart + 1 };
}

export function parseJson(src: string): ParseResult {
  try {
    return { ok: true, value: new Parser(src).parse() };
  } catch (error) {
    if (!(error instanceof Fail)) throw error;
    return {
      ok: false,
      error: { message: error.reason, offset: error.offset, ...locate(src, error.offset) },
    };
  }
}

/** Текст ошибки для интерфейса: «что случилось. Строка N, позиция M». */
export function describeError(error: JsonError): string {
  return `${error.message}. Строка ${error.line}, позиция ${error.column}`;
}

export interface FormatOptions {
  /** 0 — минификация. */
  indent: number;
  sortKeys: boolean;
}

const byKey = (a: JsonEntry, b: JsonEntry): number => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);

export function stringify(node: JsonNode, options: FormatOptions): string {
  const out: string[] = [];
  const pad = ' '.repeat(options.indent);
  const nl = options.indent > 0 ? '\n' : '';
  const colon = options.indent > 0 ? ': ' : ':';

  const write = (n: JsonNode, level: number): void => {
    if (n.kind === 'object' || n.kind === 'array') {
      const [open, close] = n.kind === 'object' ? ['{', '}'] : ['[', ']'];
      const children = n.kind === 'object' ? n.entries : n.items;
      if (children.length === 0) {
        out.push(open, close);
        return;
      }
      const inner = nl + pad.repeat(level + 1);
      out.push(open);
      if (n.kind === 'object') {
        const entries = options.sortKeys ? n.entries.toSorted(byKey) : n.entries;
        entries.forEach((entry, i) => {
          out.push(i === 0 ? inner : `,${inner}`, entry.raw, colon);
          write(entry.value, level + 1);
        });
      } else {
        n.items.forEach((item, i) => {
          out.push(i === 0 ? inner : `,${inner}`);
          write(item, level + 1);
        });
      }
      out.push(nl + pad.repeat(level), close);
      return;
    }
    out.push(n.raw);
  };

  write(node, 0);
  return out.join('');
}

/** Путь узла в нотации JSONPath: $.items[0]["first name"]. */
export function pathSegment(parent: string, key: string | number): string {
  if (typeof key === 'number') return `${parent}[${key}]`;
  return /^[A-Za-z_$][\w$]*$/.test(key) ? `${parent}.${key}` : `${parent}[${JSON.stringify(key)}]`;
}

export function countNodes(node: JsonNode): number {
  if (node.kind === 'object') return node.entries.reduce((n, e) => n + countNodes(e.value), 1);
  if (node.kind === 'array') return node.items.reduce((n, item) => n + countNodes(item), 1);
  return 1;
}

export function utf8Bytes(text: string): number {
  return new TextEncoder().encode(text).length;
}

/** Синтетический пример до первого ввода: показывает, что числа не переписываются. */
export const EXAMPLE = `{"id":12345678901234567890,"name":"DoKey","tags":["json","jwt"],"active":true,"owner":null,"limits":{"soft":2.0,"hard":1e7}}`;
