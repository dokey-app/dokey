// Построчное сравнение: алгоритм Майерса O(ND), общие начало и конец отсекаются заранее.
// Пороги держат вкладку отзывчивой: время и память растут с числом отличий.

export const MAX_LINES = 10_000;
export const MAX_CHANGES = 2_000;

export type DiffKind = 'same' | 'add' | 'del';

export interface DiffLine {
  kind: DiffKind;
  text: string;
}

export type DiffResult =
  { ok: true; lines: DiffLine[]; added: number; removed: number } | { ok: false; error: string };

const split = (text: string): string[] => (text === '' ? [] : text.split(/\r\n|\r|\n/));

/** Кратчайший сценарий правки a → b или null, если правок больше limit. */
function myers(a: string[], b: string[], limit: number): DiffLine[] | null {
  const n = a.length;
  const m = b.length;
  const max = Math.min(n + m, limit);
  const v = new Int32Array(2 * max + 2);
  const trace: Int32Array[] = [];

  for (let d = 0; d <= max; d += 1) {
    trace.push(v.slice());
    for (let k = -d; k <= d; k += 2) {
      const down = k === -d || (k !== d && v[max + k - 1]! < v[max + k + 1]!);
      let x = down ? v[max + k + 1]! : v[max + k - 1]! + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x += 1;
        y += 1;
      }
      v[max + k] = x;
      if (x >= n && y >= m) return backtrack(a, b, trace, max);
    }
  }
  return null;
}

function backtrack(a: string[], b: string[], trace: Int32Array[], max: number): DiffLine[] {
  const lines: DiffLine[] = [];
  let x = a.length;
  let y = b.length;
  for (let d = trace.length - 1; d >= 0; d -= 1) {
    const v = trace[d]!;
    const k = x - y;
    const down = k === -d || (k !== d && v[max + k - 1]! < v[max + k + 1]!);
    const prevK = down ? k + 1 : k - 1;
    const prevX = v[max + prevK]!;
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      x -= 1;
      y -= 1;
      lines.push({ kind: 'same', text: a[x]! });
    }
    if (d === 0) break;
    if (down) {
      y -= 1;
      lines.push({ kind: 'add', text: b[y]! });
    } else {
      x -= 1;
      lines.push({ kind: 'del', text: a[x]! });
    }
  }
  return lines.toReversed();
}

export function diffLines(before: string, after: string): DiffResult {
  const a = split(before);
  const b = split(after);
  if (a.length > MAX_LINES || b.length > MAX_LINES) {
    return { ok: false, error: `Сравниваются тексты до ${MAX_LINES} строк. Сократите ввод` };
  }

  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start += 1;
  let end = 0;
  while (
    end < a.length - start &&
    end < b.length - start &&
    a[a.length - 1 - end] === b[b.length - 1 - end]
  ) {
    end += 1;
  }

  const middle = myers(a.slice(start, a.length - end), b.slice(start, b.length - end), MAX_CHANGES);
  if (!middle) {
    return { ok: false, error: `Отличий больше ${MAX_CHANGES} строк. Сравните тексты по частям` };
  }

  const lines: DiffLine[] = [
    ...a.slice(0, start).map((text) => ({ kind: 'same' as const, text })),
    ...middle,
    ...a.slice(a.length - end).map((text) => ({ kind: 'same' as const, text })),
  ];
  return {
    ok: true,
    lines,
    added: lines.filter((line) => line.kind === 'add').length,
    removed: lines.filter((line) => line.kind === 'del').length,
  };
}

const SIGN: Record<DiffKind, string> = { same: ' ', add: '+', del: '-' };

/** Текст для буфера: знак в начале строки, как в unified diff без заголовков. */
export const formatDiff = (lines: DiffLine[]): string =>
  lines.map((line) => `${SIGN[line.kind]} ${line.text}`).join('\n');
