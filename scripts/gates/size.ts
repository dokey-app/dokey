import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import filePlugin from '@size-limit/file';
import sizeLimit from 'size-limit';
import { type Gate, fail, pass, pending, runGate } from './gate.ts';

// G-02 «бюджеты веса» — NFR-03, NFR-06, NFR-18. Единственный источник бюджетов —
// `.size-limit.json`; счёт ведёт size-limit 13.0.3 (ADR-16) своим Node API, потому что
// бюджет, чьего предмета в сборке ещё нет, должен читаться как «предмета нет», а не как
// ошибка инструмента.
//
// Определение «initial JS» задано D-88: инлайновые <script> собранного HTML плюс всё,
// достижимое из <script src> по статическим import; достижимое только через import()
// (чанки КМП-08…КМП-11, sw, worker) не считается. Порог берётся по максимуму среди
// маршрутов реестра. Реализует определение задача T-016; здесь строка NFR-03 пока меряет
// весь JS сборки — на заглушке его ноль байт, и это наблюдаемый факт, а не умолчание.

interface Budget {
  name: string;
  path: string | string[];
  limit: string;
  gzip?: boolean;
}

const UNITS: Record<string, number> = { b: 1, kb: 1000, mb: 1000 * 1000 };

function toBytes(limit: string): number {
  const match = /^([\d.]+)\s*([a-zA-Z]+)$/.exec(limit.trim());
  if (!match) throw new Error(`бюджет «${limit}» не разобран`);
  const [, amount = '', unit = ''] = match;
  const factor = UNITS[unit.toLowerCase()];
  if (factor === undefined) throw new Error(`единица «${unit}» неизвестна`);
  return Number(amount) * factor;
}

async function expand(patterns: string | string[]): Promise<string[]> {
  const list = Array.isArray(patterns) ? patterns : [patterns];
  const files: string[] = [];
  for (const pattern of list) {
    for await (const entry of glob(pattern)) files.push(entry);
  }
  return files.toSorted();
}

export const gate: Gate = {
  id: 'G-02',
  command: 'gate:size',
  claim: 'бюджеты веса сборки соблюдены',
  enabledIn: 'Э-0',
  async run() {
    let budgets: Budget[];
    try {
      budgets = JSON.parse(await readFile('.size-limit.json', 'utf8')) as Budget[];
    } catch {
      return fail('нет файла .size-limit.json — бюджеты негде объявить');
    }

    const lines: string[] = [];
    const broken: string[] = [];
    let measured = 0;

    for (const budget of budgets) {
      const files = await expand(budget.path);
      const limit = toBytes(budget.limit);

      if (files.length === 0) {
        lines.push(`  ${budget.name}: предмета в сборке нет, бюджет ${budget.limit}`);
        continue;
      }

      const checks = { checks: [{ files, gzip: budget.gzip !== false }] };
      const [result] = (await sizeLimit([filePlugin], checks)) as { size?: number }[];
      const size = result?.size ?? 0;
      measured += 1;
      lines.push(`  ${budget.name}: ${size} B из ${limit} B (${files.length} файлов)`);
      if (size > limit) broken.push(`${budget.name}: ${size} B > ${limit} B`);
    }

    if (broken.length > 0) return fail(`${broken.join('; ')}\n${lines.join('\n')}`);
    if (measured === 0) return pending('Э-0 — ни у одного бюджета нет предмета в сборке');
    return pass(`${measured} из ${budgets.length} бюджетов измерены\n${lines.join('\n')}`);
  },
};

if (import.meta.filename === process.argv[1]) await runGate(gate);
