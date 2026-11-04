/** Число из поля: разделитель — точка или запятая; null — поле не число. */
export function parseDecimal(value: string): number | null {
  const text = value.trim().replace(',', '.');
  if (!/^[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i.test(text)) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

/** Без хвоста двоичного округления: 0.1 + 0.2 показывается как 0.3. */
export const formatNumber = (value: number): string => String(Number(value.toPrecision(15)));
