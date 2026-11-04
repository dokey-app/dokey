// Калькулятор выражений: разбор рекурсивным спуском. Ввод не исполняется как код:
// eval и new Function запрещены CSP, а здесь и не нужны — вычисляется только грамматика ниже.
//
// выражение  := слагаемое (('+' | '-') слагаемое)*
// слагаемое  := унарное (('*' | '/' | '%') унарное)*
// унарное    := ('+' | '-') унарное | степень
// степень    := постфикс ('^' унарное)?       правоассоциативна; -2 ^ 2 = -4
// постфикс   := первичное '!'*
// первичное  := число | имя | имя '(' аргументы ')' | '(' выражение ')'

import { formatNumber } from '../../ui/number.ts';

export type MathResult =
  { ok: true; value: number; text: string } | { ok: false; error: string; position: number };

const MAX_DEPTH = 200;
const MAX_FACTORIAL = 170;

export const MAX_LENGTH = 10_000;

const CONSTANTS: Record<string, number> = { pi: Math.PI, π: Math.PI, e: Math.E, tau: 2 * Math.PI };

type Fn = { arity: [number, number]; call: (...args: number[]) => number };

const unary = (call: (x: number) => number): Fn => ({ arity: [1, 1], call });

const FUNCTIONS: Record<string, Fn> = {
  sqrt: unary(Math.sqrt),
  cbrt: unary(Math.cbrt),
  abs: unary(Math.abs),
  sign: unary(Math.sign),
  round: unary(Math.round),
  floor: unary(Math.floor),
  ceil: unary(Math.ceil),
  trunc: unary(Math.trunc),
  exp: unary(Math.exp),
  ln: unary(Math.log),
  log2: unary(Math.log2),
  log10: unary(Math.log10),
  sin: unary(Math.sin),
  cos: unary(Math.cos),
  tan: unary(Math.tan),
  asin: unary(Math.asin),
  acos: unary(Math.acos),
  atan: unary(Math.atan),
  sinh: unary(Math.sinh),
  cosh: unary(Math.cosh),
  tanh: unary(Math.tanh),
  log: {
    arity: [1, 2],
    call: (x, base) => (base === undefined ? Math.log10(x) : Math.log(x) / Math.log(base)),
  },
  pow: { arity: [2, 2], call: (x, y) => x! ** y! },
  mod: { arity: [2, 2], call: (x, y) => x! % y! },
  hypot: { arity: [1, 64], call: Math.hypot },
  min: { arity: [1, 64], call: Math.min },
  max: { arity: [1, 64], call: Math.max },
};

class MathError extends Error {
  readonly position: number;

  constructor(message: string, position: number) {
    super(message);
    this.position = position;
  }
}

class Parser {
  private readonly text: string;
  private index = 0;
  private depth = 0;

  constructor(text: string) {
    this.text = text;
  }

  parse(): number {
    const value = this.expression();
    this.skipSpaces();
    if (this.index < this.text.length) {
      const char = this.text[this.index];
      if (char === ',') throw new MathError('Дробную часть отделяйте точкой: 3.14', this.index + 1);
      if (char === ')') throw new MathError('Лишняя закрывающая скобка', this.index + 1);
      throw new MathError('Ожидался оператор: + − * / % ^', this.index + 1);
    }
    return value;
  }

  private skipSpaces(): void {
    while (/\s/.test(this.text[this.index] ?? '')) this.index += 1;
  }

  private peek(): string {
    this.skipSpaces();
    return this.text[this.index] ?? '';
  }

  private nested<T>(parse: () => T): T {
    this.depth += 1;
    if (this.depth > MAX_DEPTH) {
      throw new MathError(`Вложенность — до ${MAX_DEPTH} уровней`, this.index + 1);
    }
    const value = parse();
    this.depth -= 1;
    return value;
  }

  private expression(): number {
    let value = this.term();
    for (;;) {
      const char = this.peek();
      if (char !== '+' && char !== '-' && char !== '−') return value;
      this.index += 1;
      const right = this.term();
      value = char === '+' ? value + right : value - right;
    }
  }

  private term(): number {
    let value = this.unary();
    for (;;) {
      const char = this.peek();
      if (!'*×/÷%'.includes(char) || char === '') return value;
      const position = this.index + 1;
      this.index += 1;
      const right = this.unary();
      if ('/÷%'.includes(char) && right === 0) throw new MathError('Деление на ноль', position);
      if (char === '%') value %= right;
      else if (char === '/' || char === '÷') value /= right;
      else value *= right;
    }
  }

  private unary(): number {
    return this.nested(() => {
      const char = this.peek();
      if (char === '+' || char === '-' || char === '−') {
        this.index += 1;
        const value = this.unary();
        return char === '+' ? value : -value;
      }
      return this.power();
    });
  }

  private power(): number {
    const base = this.postfix();
    if (this.peek() !== '^') return base;
    this.index += 1;
    return base ** this.unary();
  }

  private postfix(): number {
    let value = this.primary();
    while (this.peek() === '!') {
      const position = this.index + 1;
      this.index += 1;
      value = factorial(value, position);
    }
    return value;
  }

  private primary(): number {
    const char = this.peek();
    if (char === '(') {
      const position = this.index + 1;
      this.index += 1;
      const value = this.nested(() => this.expression());
      if (this.peek() !== ')') throw new MathError('Скобка не закрыта', position);
      this.index += 1;
      return value;
    }
    if (/[\d.]/.test(char)) return this.number();
    if (/[\p{L}_]/u.test(char)) return this.name();
    if (char === '') throw new MathError('Выражение оборвано', this.text.length);
    throw new MathError(`Неожиданный символ «${char}»`, this.index + 1);
  }

  private number(): number {
    const match = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(this.text.slice(this.index));
    if (!match) throw new MathError('Ожидалось число', this.index + 1);
    this.index += match[0].length;
    return Number(match[0]);
  }

  private name(): number {
    const start = this.index;
    const match = /^[\p{L}_][\p{L}\p{N}_]*/u.exec(this.text.slice(start))!;
    this.index += match[0].length;
    const name = match[0].toLowerCase();

    if (this.peek() !== '(') {
      if (!Object.hasOwn(CONSTANTS, name)) {
        throw new MathError(`Неизвестное имя «${match[0]}»`, start + 1);
      }
      return CONSTANTS[name]!;
    }

    const fn = Object.hasOwn(FUNCTIONS, name) ? FUNCTIONS[name] : undefined;
    if (!fn) throw new MathError(`Неизвестная функция «${match[0]}»`, start + 1);
    const args = this.nested(() => this.arguments());
    const [min, max] = fn.arity;
    if (args.length < min || args.length > max) {
      const expected = min === max ? String(min) : `от ${min} до ${max}`;
      throw new MathError(`${name}: аргументов должно быть ${expected}`, start + 1);
    }
    return fn.call(...args);
  }

  private arguments(): number[] {
    const open = this.index + 1;
    this.index += 1;
    const args = [this.expression()];
    while (this.peek() === ',') {
      this.index += 1;
      args.push(this.expression());
    }
    if (this.peek() !== ')') throw new MathError('Скобка не закрыта', open);
    this.index += 1;
    return args;
  }
}

function factorial(value: number, position: number): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new MathError('Факториал — только от целого числа не меньше нуля', position);
  }
  if (value > MAX_FACTORIAL) throw new MathError('Результат вне диапазона чисел', position);
  let result = 1;
  for (let i = 2; i <= value; i += 1) result *= i;
  return result;
}

export function evaluate(input: string): MathResult {
  if (input.length > MAX_LENGTH) {
    return { ok: false, error: `Выражение — до ${MAX_LENGTH} знаков`, position: MAX_LENGTH };
  }
  try {
    const value = new Parser(input).parse();
    if (Number.isNaN(value)) {
      return { ok: false, error: 'Результат не определён: проверьте аргументы', position: 1 };
    }
    if (!Number.isFinite(value)) {
      return { ok: false, error: 'Результат вне диапазона чисел', position: 1 };
    }
    return { ok: true, value, text: formatNumber(value) };
  } catch (error) {
    if (error instanceof MathError) {
      return { ok: false, error: error.message, position: error.position };
    }
    throw error;
  }
}
