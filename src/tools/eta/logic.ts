export { formatInstant } from '../timestamp/logic.ts';

export interface EtaInput {
  total: number;
  done: number;
  amount: number;
  unitMs: number;
  startMs: number;
}

export type EtaResult =
  | { ok: true; remaining: number; durationMs: number; finishMs: number }
  | { ok: false; error: string };

/** Диапазон Date: дальше момент окончания не назвать. */
const MAX_INSTANT_MS = 8.64e15;

export const UNITS = [
  { id: 'second', name: 'Секунду', ms: 1000 },
  { id: 'minute', name: 'Минуту', ms: 60_000 },
  { id: 'hour', name: 'Час', ms: 3_600_000 },
  { id: 'day', name: 'День', ms: 86_400_000 },
] as const;

export function eta(input: EtaInput): EtaResult {
  const { total, done, amount, unitMs, startMs } = input;
  if (total < 0 || done < 0) return { ok: false, error: 'Объём не может быть меньше нуля' };
  if (amount <= 0) return { ok: false, error: 'Скорость должна быть больше нуля' };
  if (done > total) return { ok: false, error: 'Готово больше, чем всего: проверьте числа' };
  const remaining = total - done;
  const durationMs = (remaining / amount) * unitMs;
  const finishMs = startMs + durationMs;
  if (Math.abs(finishMs) > MAX_INSTANT_MS) {
    return { ok: false, error: 'Окончание слишком далеко: проверьте скорость' };
  }
  return { ok: true, remaining, durationMs, finishMs };
}

const PARTS: [string, number][] = [
  ['дн', 86_400_000],
  ['ч', 3_600_000],
  ['мин', 60_000],
  ['с', 1000],
];

/** «2 дн 3 ч 15 мин»; меньше секунды — миллисекунды. Самые мелкие части при днях отбрасываются. */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} мс`;
  let rest = Math.round(ms / 1000) * 1000;
  const parts: string[] = [];
  for (const [name, size] of PARTS) {
    const count = Math.floor(rest / size);
    rest -= count * size;
    if (count > 0) parts.push(`${count} ${name}`);
  }
  return parts.slice(0, 3).join(' ');
}
