export type PercentResult = { ok: true; value: number } | { ok: false; error: string };

/** Сколько составляет percent % от base. */
export const percentOf = (percent: number, base: number): PercentResult => ({
  ok: true,
  value: (base * percent) / 100,
});

/** Сколько процентов part составляет от whole. */
export const shareOf = (part: number, whole: number): PercentResult =>
  whole === 0
    ? { ok: false, error: 'На ноль делить нельзя: второе число не может быть 0' }
    : { ok: true, value: (part / whole) * 100 };

/** На сколько процентов изменилось значение: от before к after. */
export const changeBetween = (before: number, after: number): PercentResult =>
  before === 0
    ? { ok: false, error: 'Изменение от нуля в процентах не считается: укажите другое начало' }
    : { ok: true, value: ((after - before) / Math.abs(before)) * 100 };
